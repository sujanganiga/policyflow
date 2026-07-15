const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Policy = require('../models/Policy');
const { validateCustomerData, validatePolicyData } = require('../utils/validation');
const { maskCustomer } = require('../utils/masking');

const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase(), role });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  req.session.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return res.json({
    message: 'Login successful',
    user: req.session.user,
  });
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully' });
  });
};

const getMe = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  return res.json({ user: req.session.user });
};

const createAgent = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const agent = await User.create({
    name,
    email,
    password,
    role: 'agent',
    isActive: true,
  });

  return res.status(201).json({
    message: 'Agent created successfully',
    agent: {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      isActive: agent.isActive,
      createdAt: agent.createdAt,
    },
  });
};

const listAgents = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const [agents, total] = await Promise.all([
    User.find({ ...filter, role: 'agent' })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments({ ...filter, role: 'agent' }),
  ]);

  const agentsWithCounts = await Promise.all(
    agents.map(async (agent) => {
      const [customerCount, policyCount] = await Promise.all([
        Customer.countDocuments({ agentId: agent._id }),
        Policy.countDocuments({ agentId: agent._id }),
      ]);
      return {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        isActive: agent.isActive,
        createdAt: agent.createdAt,
        summary: { customerCount, policyCount },
      };
    })
  );

  return res.json({
    agents: agentsWithCounts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const deactivateAgent = async (req, res) => {
  const agent = await User.findOne({ _id: req.params.id, role: 'agent' });
  if (!agent) {
    return res.status(404).json({ message: 'Agent not found' });
  }

  agent.isActive = false;
  await agent.save();

  return res.json({ message: 'Agent deactivated successfully' });
};

const createCustomer = async (req, res) => {
  const errors = validateCustomerData(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const duplicateQuery = [{ aadhaar: req.body.aadhaar }];
  if (req.body.pan) duplicateQuery.push({ pan: req.body.pan.toUpperCase() });

  const duplicate = await Customer.findOne({ $or: duplicateQuery });
  if (duplicate) {
    const dupErrors = {};
    if (duplicate.aadhaar === req.body.aadhaar) {
      dupErrors.aadhaar = 'Aadhaar already exists';
    }
    if (req.body.pan && duplicate.pan === req.body.pan.toUpperCase()) {
      dupErrors.pan = 'PAN already exists';
    }
    return res.status(409).json({ message: 'Duplicate record', errors: dupErrors });
  }

  const customer = await Customer.create({
    ...req.body,
    pan: req.body.pan ? req.body.pan.toUpperCase() : undefined,
    agentId: req.session.user.id,
  });

  return res.status(201).json({
    message: 'Customer created successfully',
    customer: maskCustomer(customer),
  });
};

const searchCustomers = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const customers = await Customer.find({
    agentId: req.session.user.id,
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { mobile: { $regex: q } },
    ],
  }).limit(20);

  return res.json({
    customers: customers.map(maskCustomer),
  });
};

const getCustomer = async (req, res) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    agentId: req.session.user.id,
  });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const policyCount = await Policy.countDocuments({ customerId: customer._id });
  return res.json({
    customer: maskCustomer(customer),
    summary: { policyCount },
  });
};

const updateCustomer = async (req, res) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    agentId: req.session.user.id,
  });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const merged = {
    name: req.body.name ?? customer.name,
    email: req.body.email ?? customer.email,
    mobile: req.body.mobile ?? customer.mobile,
    aadhaar: req.body.aadhaar ?? customer.aadhaar,
    pan: req.body.pan ?? customer.pan,
    dateOfBirth: req.body.dateOfBirth ?? customer.dateOfBirth,
    nomineeName: req.body.nomineeName ?? customer.nomineeName,
    nomineeRelation: req.body.nomineeRelation ?? customer.nomineeRelation,
  };

  const errors = validateCustomerData(merged, { isUpdate: true });
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  if (req.body.aadhaar && req.body.aadhaar !== customer.aadhaar) {
    const dup = await Customer.findOne({ aadhaar: req.body.aadhaar });
    if (dup) {
      return res.status(409).json({
        message: 'Duplicate record',
        errors: { aadhaar: 'Aadhaar already exists' },
      });
    }
  }

  if (req.body.pan && req.body.pan.toUpperCase() !== customer.pan) {
    const dup = await Customer.findOne({ pan: req.body.pan.toUpperCase() });
    if (dup) {
      return res.status(409).json({
        message: 'Duplicate record',
        errors: { pan: 'PAN already exists' },
      });
    }
  }

  Object.assign(customer, {
    ...req.body,
    pan: req.body.pan ? req.body.pan.toUpperCase() : customer.pan,
  });
  await customer.save();

  return res.json({
    message: 'Customer updated successfully',
    customer: maskCustomer(customer),
  });
};

const issuePolicy = async (req, res) => {
  const errors = validatePolicyData(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const customer = await Customer.findOne({
    _id: req.body.customerId,
    agentId: req.session.user.id,
  });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const customerErrors = validateCustomerData(
    {
      name: customer.name,
      nomineeName: customer.nomineeName,
      pan: customer.pan,
    },
    { premiumAmount: req.body.premiumAmount }
  );

  if (customerErrors.pan) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: { pan: customerErrors.pan },
    });
  }

  const policyNumber = `POL-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

  const policy = await Policy.create({
    policyNumber,
    customerId: customer._id,
    agentId: req.session.user.id,
    term: Number(req.body.term),
    premiumAmount: Number(req.body.premiumAmount),
    premiumFrequency: req.body.premiumFrequency,
    startDate: new Date(req.body.startDate),
  });

  return res.status(201).json({
    message: 'Policy issued successfully',
    policy,
  });
};

const getCustomerPolicies = async (req, res) => {
  const customer = await Customer.findOne({
    _id: req.params.customerId,
    agentId: req.session.user.id,
  });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const policies = await Policy.find({
    customerId: req.params.customerId,
    agentId: req.session.user.id,
  }).sort({ createdAt: -1 });

  return res.json({ policies });
};

module.exports = {
  login,
  logout,
  getMe,
  createAgent,
  listAgents,
  deactivateAgent,
  createCustomer,
  searchCustomers,
  getCustomer,
  updateCustomer,
  issuePolicy,
  getCustomerPolicies,
};

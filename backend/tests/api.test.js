const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Policy = require('../src/models/Policy');
const { SESSION_MAX_AGE } = require('../src/middleware/auth');

jest.mock('../src/models/User');
jest.mock('../src/models/Customer');
jest.mock('../src/models/Policy');

const mockAgentId = new mongoose.Types.ObjectId();
const mockCustomerId = new mongoose.Types.ObjectId();

const mockAgent = {
  _id: mockAgentId,
  name: 'Test Agent',
  email: 'agent@test.com',
  role: 'agent',
  isActive: true,
  comparePassword: jest.fn().mockResolvedValue(true),
};

const mockAdmin = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Admin',
  email: 'admin@test.com',
  role: 'admin',
  isActive: true,
  comparePassword: jest.fn().mockResolvedValue(true),
};

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects invalid credentials', async () => {
    User.findOne.mockResolvedValue(mockAgent);
    mockAgent.comparePassword.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@test.com', password: 'wrong', role: 'agent' });

    expect(res.status).toBe(401);
  });

  test('logs in with valid credentials and sets cookie', async () => {
    User.findOne.mockResolvedValue(mockAgent);
    mockAgent.comparePassword.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@test.com', password: 'Agent@123', role: 'agent' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('agent');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('uses the required 15-minute session duration', () => {
    expect(SESSION_MAX_AGE).toBe(15 * 60 * 1000);
  });

  test('rejects login for an inactive agent', async () => {
    User.findOne.mockResolvedValue({ ...mockAgent, isActive: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@test.com', password: 'Agent@123', role: 'agent' });

    expect(res.status).toBe(401);
  });

  test('logs out and clears the session cookie', async () => {
    User.findOne.mockResolvedValue(mockAgent);
    mockAgent.comparePassword.mockResolvedValue(true);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@test.com', password: 'Agent@123', role: 'agent' });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', loginRes.headers['set-cookie']);

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});

describe('Customer API', () => {
  const loginAndGetCookie = async () => {
    User.findOne.mockResolvedValue(mockAgent);
    mockAgent.comparePassword.mockResolvedValue(true);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@test.com', password: 'Agent@123', role: 'agent' });
    return loginRes.headers['set-cookie'];
  };

  test('agent can create customer with masked PII', async () => {
    const cookie = await loginAndGetCookie();
    Customer.findOne.mockResolvedValue(null);
    Customer.create.mockResolvedValue({
      _id: mockCustomerId,
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      mobile: '9876543210',
      aadhaar: '123456789012',
      dateOfBirth: new Date('1990-05-15'),
      nomineeName: 'Priya Sharma',
      nomineeRelation: 'Spouse',
      toObject: function () {
        return { ...this };
      },
    });

    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', cookie)
      .send({
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        mobile: '9876543210',
        aadhaar: '123456789012',
        dateOfBirth: '1990-05-15',
        nomineeName: 'Priya Sharma',
        nomineeRelation: 'Spouse',
      });

    expect(res.status).toBe(201);
    expect(res.body.customer.mobile).toBe('98XXXXXX10');
    expect(res.body.customer.aadhaar).toBe('XXXX-XXXX-9012');
  });

  test('agent cannot access another agents customer', async () => {
    const cookie = await loginAndGetCookie();
    Customer.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/customers/${mockCustomerId}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(404);
  });

  test('agent can update their own customer', async () => {
    const cookie = await loginAndGetCookie();
    const customer = {
      _id: mockCustomerId,
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      mobile: '9876543210',
      aadhaar: '123456789012',
      dateOfBirth: new Date('1990-05-15'),
      nomineeName: 'Priya Sharma',
      nomineeRelation: 'Spouse',
      save: jest.fn().mockResolvedValue(),
      toObject: function () {
        return { ...this };
      },
    };
    Customer.findOne.mockResolvedValue(customer);

    const res = await request(app)
      .put(`/api/customers/${mockCustomerId}`)
      .set('Cookie', cookie)
      .send({
        name: 'Rahul Kumar',
        email: 'rahul@example.com',
        mobile: '9876543210',
        nomineeName: 'Priya Sharma',
        nomineeRelation: 'Spouse',
      });

    expect(res.status).toBe(200);
    expect(customer.save).toHaveBeenCalled();
    expect(res.body.customer.name).toBe('Rahul Kumar');
  });

  test('requires PAN before issuing a policy above ₹50,000', async () => {
    const cookie = await loginAndGetCookie();
    Customer.findOne.mockResolvedValue({
      _id: mockCustomerId,
      name: 'Rahul Sharma',
      pan: undefined,
      nomineeName: 'Priya Sharma',
    });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await request(app)
      .post('/api/policies/issue')
      .set('Cookie', cookie)
      .send({
        customerId: mockCustomerId.toString(),
        term: 20,
        premiumAmount: 60000,
        premiumFrequency: 'Yearly',
        startDate: tomorrow.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.errors.pan).toBeDefined();
    expect(Policy.create).not.toHaveBeenCalled();
  });

  test('rejects a duplicate Aadhaar number', async () => {
    const cookie = await loginAndGetCookie();
    Customer.findOne.mockResolvedValue({ aadhaar: '123456789012' });

    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', cookie)
      .send({
        name: 'New Customer',
        email: 'new@example.com',
        mobile: '9876543210',
        aadhaar: '123456789012',
        dateOfBirth: '1990-05-15',
        nomineeName: 'Another Person',
        nomineeRelation: 'Spouse',
      });

    expect(res.status).toBe(409);
    expect(res.body.errors.aadhaar).toBeDefined();
  });

  test('rejects a duplicate PAN number', async () => {
    const cookie = await loginAndGetCookie();
    Customer.findOne.mockResolvedValue({ pan: 'ABCDE1234F' });

    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', cookie)
      .send({
        name: 'New Customer',
        email: 'new@example.com',
        mobile: '9876543210',
        aadhaar: '987654321098',
        pan: 'ABCDE1234F',
        dateOfBirth: '1990-05-15',
        nomineeName: 'Another Person',
        nomineeRelation: 'Spouse',
      });

    expect(res.status).toBe(409);
    expect(res.body.errors.pan).toBeDefined();
  });
});

describe('Policy API', () => {
  test('agent cannot issue a policy for another agent\'s customer', async () => {
    User.findOne.mockResolvedValue(mockAgent);
    mockAgent.comparePassword.mockResolvedValue(true);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@test.com', password: 'Agent@123', role: 'agent' });
    Customer.findOne.mockResolvedValue(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await request(app)
      .post('/api/policies/issue')
      .set('Cookie', loginRes.headers['set-cookie'])
      .send({
        customerId: mockCustomerId.toString(),
        term: 20,
        premiumAmount: 10000,
        premiumFrequency: 'Yearly',
        startDate: tomorrow.toISOString(),
      });

    expect(res.status).toBe(404);
    expect(Policy.create).not.toHaveBeenCalled();
  });
});

describe('Admin API', () => {
  test('admin can create agent', async () => {
    User.findOne.mockResolvedValueOnce(mockAdmin);
    mockAdmin.comparePassword.mockResolvedValue(true);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123', role: 'admin' });

    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      name: 'New Agent',
      email: 'newagent@test.com',
      role: 'agent',
      isActive: true,
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/admin/agents')
      .set('Cookie', loginRes.headers['set-cookie'])
      .send({
        name: 'New Agent',
        email: 'newagent@test.com',
        password: 'Agent@123',
      });

    expect(res.status).toBe(201);
    expect(res.body.agent.email).toBe('newagent@test.com');
  });

  test('agent cannot access admin routes', async () => {
    User.findOne.mockResolvedValue(mockAgent);
    mockAgent.comparePassword.mockResolvedValue(true);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@test.com', password: 'Agent@123', role: 'agent' });

    const res = await request(app)
      .get('/api/admin/agents')
      .set('Cookie', loginRes.headers['set-cookie']);

    expect(res.status).toBe(403);
  });

  test('admin can deactivate an agent', async () => {
    const agentToDeactivate = {
      _id: new mongoose.Types.ObjectId(),
      role: 'agent',
      isActive: true,
      save: jest.fn().mockResolvedValue(),
    };
    User.findOne.mockResolvedValueOnce(mockAdmin);
    mockAdmin.comparePassword.mockResolvedValue(true);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123', role: 'admin' });

    User.findOne.mockResolvedValueOnce(agentToDeactivate);
    const res = await request(app)
      .delete(`/api/admin/agents/${agentToDeactivate._id}`)
      .set('Cookie', loginRes.headers['set-cookie']);

    expect(res.status).toBe(200);
    expect(agentToDeactivate.isActive).toBe(false);
    expect(agentToDeactivate.save).toHaveBeenCalled();
  });

  test('returns paginated agents filtered by status', async () => {
    User.findOne.mockResolvedValueOnce(mockAdmin);
    mockAdmin.comparePassword.mockResolvedValue(true);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123', role: 'admin' });

    const agents = [{
      _id: new mongoose.Types.ObjectId(),
      name: 'Inactive Agent',
      email: 'inactive@example.com',
      isActive: false,
      createdAt: new Date(),
    }];
    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(agents),
    };
    User.find.mockReturnValue(query);
    User.countDocuments.mockResolvedValue(1);
    Customer.countDocuments.mockResolvedValue(0);
    Policy.countDocuments.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/admin/agents?page=2&limit=5&status=inactive')
      .set('Cookie', loginRes.headers['set-cookie']);

    expect(res.status).toBe(200);
    expect(User.find).toHaveBeenCalledWith({ isActive: false, role: 'agent' });
    expect(res.body.pagination).toMatchObject({ page: 2, limit: 5, total: 1 });
    expect(res.body.agents).toHaveLength(1);
  });

  test('admin cannot create customers', async () => {
    User.findOne.mockResolvedValue(mockAdmin);
    mockAdmin.comparePassword.mockResolvedValue(true);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123', role: 'admin' });

    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', loginRes.headers['set-cookie'])
      .send({});

    expect(res.status).toBe(403);
  });
});

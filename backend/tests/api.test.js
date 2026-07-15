const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');

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
});

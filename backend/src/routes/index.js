const express = require('express');
const {
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
} = require('../controllers');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/auth/login', login);
router.post('/auth/logout', requireAuth, logout);
router.get('/auth/me', getMe);

router.post('/admin/agents', requireAuth, requireRole('admin'), createAgent);
router.get('/admin/agents', requireAuth, requireRole('admin'), listAgents);
router.delete('/admin/agents/:id', requireAuth, requireRole('admin'), deactivateAgent);

router.post('/customers', requireAuth, requireRole('agent'), createCustomer);
router.get('/customers/search', requireAuth, requireRole('agent'), searchCustomers);
router.get('/customers/:id', requireAuth, requireRole('agent'), getCustomer);
router.put('/customers/:id', requireAuth, requireRole('agent'), updateCustomer);

router.post('/policies/issue', requireAuth, requireRole('agent'), issuePolicy);
router.get(
  '/policies/customer/:customerId',
  requireAuth,
  requireRole('agent'),
  getCustomerPolicies
);

module.exports = router;

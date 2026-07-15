const {
  validateCustomerData,
  validatePolicyData,
  calculateAge,
  isValidMobile,
  isValidAadhaar,
  isValidPan,
} = require('../src/utils/validation');
const { maskAadhaar, maskPan, maskMobile } = require('../src/utils/masking');

describe('Validation utilities', () => {
  const validCustomer = {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    mobile: '9876543210',
    aadhaar: '123456789012',
    dateOfBirth: '1990-05-15',
    nomineeName: 'Priya Sharma',
    nomineeRelation: 'Spouse',
  };

  test('accepts valid customer data', () => {
    const errors = validateCustomerData(validCustomer);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  test('rejects age below 18', () => {
    const errors = validateCustomerData({
      ...validCustomer,
      dateOfBirth: '2010-01-01',
    });
    expect(errors.dateOfBirth).toBeDefined();
  });

  test('rejects age above 65', () => {
    const errors = validateCustomerData({
      ...validCustomer,
      dateOfBirth: '1950-01-01',
    });
    expect(errors.dateOfBirth).toBeDefined();
  });

  test('requires PAN when premium exceeds 50000', () => {
    const errors = validateCustomerData(validCustomer, { premiumAmount: 60000 });
    expect(errors.pan).toBeDefined();
  });

  test('rejects nominee same as policyholder', () => {
    const errors = validateCustomerData({
      ...validCustomer,
      nomineeName: 'Rahul Sharma',
    });
    expect(errors.nomineeName).toBeDefined();
  });

  test('validates mobile format', () => {
    expect(isValidMobile('9876543210')).toBe(true);
    expect(isValidMobile('5876543210')).toBe(false);
    expect(isValidMobile('98765432')).toBe(false);
  });

  test('validates aadhaar format', () => {
    expect(isValidAadhaar('123456789012')).toBe(true);
    expect(isValidAadhaar('12345')).toBe(false);
  });

  test('validates PAN format', () => {
    expect(isValidPan('ABCDE1234F')).toBe(true);
    expect(isValidPan('INVALID')).toBe(false);
  });

  test('calculates age correctly', () => {
    const age = calculateAge('1990-01-01');
    expect(age).toBeGreaterThanOrEqual(35);
    expect(age).toBeLessThanOrEqual(37);
  });
});

describe('Policy validation', () => {
  test('accepts valid policy data', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const errors = validatePolicyData({
      customerId: '507f1f77bcf86cd799439011',
      term: 20,
      premiumAmount: 10000,
      premiumFrequency: 'Yearly',
      startDate: tomorrow.toISOString(),
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  test('rejects premium below minimum', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const errors = validatePolicyData({
      customerId: '507f1f77bcf86cd799439011',
      term: 20,
      premiumAmount: 3000,
      premiumFrequency: 'Yearly',
      startDate: tomorrow.toISOString(),
    });
    expect(errors.premiumAmount).toBeDefined();
  });

  test('rejects invalid policy term', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const errors = validatePolicyData({
      customerId: '507f1f77bcf86cd799439011',
      term: 12,
      premiumAmount: 10000,
      premiumFrequency: 'Yearly',
      startDate: tomorrow.toISOString(),
    });
    expect(errors.term).toBeDefined();
  });

  test('rejects past start date', () => {
    const errors = validatePolicyData({
      customerId: '507f1f77bcf86cd799439011',
      term: 20,
      premiumAmount: 10000,
      premiumFrequency: 'Yearly',
      startDate: '2020-01-01',
    });
    expect(errors.startDate).toBeDefined();
  });
});

describe('PII masking', () => {
  test('masks aadhaar', () => {
    expect(maskAadhaar('123456789012')).toBe('XXXX-XXXX-9012');
  });

  test('masks PAN', () => {
    expect(maskPan('ABCDE1234F')).toBe('ABCXX12XXF');
  });

  test('masks mobile', () => {
    expect(maskMobile('9876543210')).toBe('98XXXXXX10');
  });
});

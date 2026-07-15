const POLICY_TERMS = [10, 15, 20, 25, 30];
const PREMIUM_FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];
const PAN_PREMIUM_THRESHOLD = 50000;
const MIN_PREMIUM = 5000;

const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
};

const isValidMobile = (mobile) => /^[6-9]\d{9}$/.test(mobile);

const isValidAadhaar = (aadhaar) => /^\d{12}$/.test(aadhaar);

const isValidPan = (pan) => /^[A-Z]{5}\d{4}[A-Z]$/.test(pan);

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const validateCustomerData = (data, { isUpdate = false, premiumAmount = 0 } = {}) => {
  const errors = {};

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || !data.name.trim()) errors.name = 'Name is required';
  }

  if (!isUpdate || data.email !== undefined) {
    if (!data.email || !data.email.trim()) errors.email = 'Email is required';
  }

  if (!isUpdate || data.mobile !== undefined) {
    if (!data.mobile) {
      errors.mobile = 'Mobile number is required';
    } else if (!isValidMobile(data.mobile)) {
      errors.mobile = 'Mobile must be 10 digits and start with 6, 7, 8, or 9';
    }
  }

  if (!isUpdate || data.aadhaar !== undefined) {
    if (!data.aadhaar) {
      errors.aadhaar = 'Aadhaar number is required';
    } else if (!isValidAadhaar(data.aadhaar)) {
      errors.aadhaar = 'Aadhaar must be exactly 12 digits';
    }
  }

  if (!isUpdate || data.dateOfBirth !== undefined) {
    if (!data.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(data.dateOfBirth);
      if (age < 18 || age > 65) {
        errors.dateOfBirth = 'Customer age must be between 18 and 65 years';
      }
    }
  }

  if (!isUpdate || data.nomineeName !== undefined) {
    if (!data.nomineeName || !data.nomineeName.trim()) {
      errors.nomineeName = 'Nominee is mandatory';
    } else if (
      data.name &&
      data.nomineeName.trim().toLowerCase() === data.name.trim().toLowerCase()
    ) {
      errors.nomineeName = 'Nominee cannot be the same person as the policyholder';
    }
  }

  if (!isUpdate || data.nomineeRelation !== undefined) {
    if (!data.nomineeRelation || !data.nomineeRelation.trim()) {
      errors.nomineeRelation = 'Nominee relation is required';
    }
  }

  const effectivePremium = premiumAmount || data.premiumAmount || 0;
  if (!isUpdate || data.pan !== undefined) {
    if (effectivePremium > PAN_PREMIUM_THRESHOLD && !data.pan) {
      errors.pan = 'PAN is mandatory when premium is greater than ₹50,000';
    } else if (data.pan && !isValidPan(data.pan)) {
      errors.pan = 'PAN must be in format ABCDE1234F';
    }
  }

  return errors;
};

const validatePolicyData = (data) => {
  const errors = {};

  if (!data.customerId) errors.customerId = 'Customer is required';

  if (!data.term) {
    errors.term = 'Policy term is required';
  } else if (!POLICY_TERMS.includes(Number(data.term))) {
    errors.term = 'Policy term must be one of 10, 15, 20, 25, or 30 years';
  }

  if (!data.premiumAmount) {
    errors.premiumAmount = 'Premium amount is required';
  } else if (Number(data.premiumAmount) < MIN_PREMIUM) {
    errors.premiumAmount = 'Minimum premium is ₹5,000';
  }

  if (!data.premiumFrequency) {
    errors.premiumFrequency = 'Premium frequency is required';
  } else if (!PREMIUM_FREQUENCIES.includes(data.premiumFrequency)) {
    errors.premiumFrequency =
      'Premium frequency must be Monthly, Quarterly, Half-Yearly, or Yearly';
  }

  if (!data.startDate) {
    errors.startDate = 'Policy start date is required';
  } else {
    const start = new Date(data.startDate);
    start.setHours(0, 0, 0, 0);
    if (start < startOfToday()) {
      errors.startDate = 'Policy start date cannot be in the past';
    }
  }

  return errors;
};

module.exports = {
  POLICY_TERMS,
  PREMIUM_FREQUENCIES,
  PAN_PREMIUM_THRESHOLD,
  MIN_PREMIUM,
  calculateAge,
  isValidMobile,
  isValidAadhaar,
  isValidPan,
  validateCustomerData,
  validatePolicyData,
};

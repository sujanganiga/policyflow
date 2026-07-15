const maskAadhaar = (aadhaar) => {
  if (!aadhaar || aadhaar.length !== 12) return aadhaar;
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
};

const maskPan = (pan) => {
  if (!pan || pan.length !== 10) return pan;
  return `${pan.slice(0, 3)}XX${pan.slice(5, 7)}XX${pan.slice(-1)}`;
};

const maskMobile = (mobile) => {
  if (!mobile || mobile.length !== 10) return mobile;
  return `${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`;
};

const maskCustomer = (customer) => {
  const obj = customer.toObject ? customer.toObject() : { ...customer };
  return {
    ...obj,
    aadhaar: maskAadhaar(obj.aadhaar),
    pan: obj.pan ? maskPan(obj.pan) : undefined,
    mobile: maskMobile(obj.mobile),
  };
};

module.exports = {
  maskAadhaar,
  maskPan,
  maskMobile,
  maskCustomer,
};

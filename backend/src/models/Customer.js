const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true },
    aadhaar: { type: String, required: true, unique: true },
    pan: { type: String, unique: true, sparse: true },
    dateOfBirth: { type: Date, required: true },
    nomineeName: { type: String, required: true, trim: true },
    nomineeRelation: { type: String, required: true, trim: true },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);

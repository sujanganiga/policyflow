const mongoose = require('mongoose');

const POLICY_TERMS = [10, 15, 20, 25, 30];
const PREMIUM_FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];

const policySchema = new mongoose.Schema(
  {
    policyNumber: { type: String, required: true, unique: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    term: { type: Number, enum: POLICY_TERMS, required: true },
    premiumAmount: { type: Number, required: true, min: 5000 },
    premiumFrequency: {
      type: String,
      enum: PREMIUM_FREQUENCIES,
      required: true,
    },
    startDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Cancelled'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Policy', policySchema);
module.exports.POLICY_TERMS = POLICY_TERMS;
module.exports.PREMIUM_FREQUENCIES = PREMIUM_FREQUENCIES;

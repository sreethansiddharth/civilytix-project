import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email:    { type: String, required: true, trim: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },

  createdAt: { type: Date, default: () => new Date() },

  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid_monthly', 'paid_lifetime'],
    default: 'unpaid'
  },
  paymentGatewayCustomerId: { type: String } 
}, { versionKey: false, collection: 'users' });

export default mongoose.model('User', userSchema);

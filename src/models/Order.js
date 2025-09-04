import mongoose from 'mongoose';
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, 
  currency: { type: String, default: process.env.DEFAULT_CURRENCY || 'usd' },
  status: { type: String, enum: ['pending', 'succeeded', 'failed'], default: 'pending' },
  paymentIntentId: { type: String }, 
  createdAt: { type: Date, default: () => new Date() }
}, { versionKey: false, collection: 'orders' });
export default mongoose.model('Order', orderSchema);

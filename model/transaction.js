import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  price: Number,
  nama: String,
  date: String,
  note: { type: String, default: "" },
  status: { type: Boolean, default: false },
});

const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;

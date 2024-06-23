import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: Number,
    nama: String,
    date: Date,
    note: { type: String, default: "" },
    status: { type: Boolean, default: false },
    type: { type: String, enum: ["income", "expense"], required: true },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;

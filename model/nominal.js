import mongoose from "mongoose";

const NominalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nominal', required: true },
  nominal: { type: Number, default:0 }
});

const Nominal = mongoose.model("Nominal", NominalSchema);
export default Nominal;

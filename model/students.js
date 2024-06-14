import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  phoneNumber: Number,
});

const Student = mongoose.model("Student", StudentSchema);
export default Student;

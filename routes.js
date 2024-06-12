import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./model/user.js";
import Transaction from "./model/transaction.js";
import Student from "./model/students.js";
import auth from "./jwt/verify.js";
import nodemailer from "nodemailer";

const router = express.Router();

// add user
// User.insertMany([
//   {
//     email: "name@gmail.com",
//     password: "12345678",
//   },
// ]);

//Transaction
// (POST)
router.post("/transaksi", async (req, res) => {
  try {
    const { price, nama, date, note, status } = req.body;

    const transaction = new Transaction({
      price,
      nama,
      date,
      note,
      status,
    });

    await transaction.save();

    res.status(201).json({ message: "Transaction created successfully!" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// (GET)
router.get("/transaksi", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// by ID (GET)
router.get("/transaksi/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json(transaction);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

//  (PUT)
router.put("/transaksi/:id", async (req, res) => {
  try {
    const { price, nama, date, note, status } = req.body;

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        price,
        nama,
        date,
        note,
        status,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Transaction updated successfully!",
      updatedTransaction,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete (DELETE)
router.delete("/transaksi/:id", async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(
      req.params.id
    );
    if (!deletedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json({
      message: "Transaction deleted successfully!",
      deletedTransaction,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Students

// Add Student
router.post("/students", async (req, res) => {
  const { name, phoneNumber } = req.body;
  try {
    const newStudent = new Student({ name, phoneNumber });
    await newStudent.save();
    res
      .status(201)
      .json({ message: "Student added successfully!", newStudent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Students
router.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Student by ID
router.delete("/students/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res
      .status(200)
      .json({ message: "Student deleted successfully!", deletedStudent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Student by ID
router.put("/students/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phoneNumber } = req.body;
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { name, phoneNumber },
      { new: true }
    );
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res
      .status(200)
      .json({ message: "Student updated successfully!", updatedStudent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//AUTH

router.post("/register", [auth.checkDuplicateEmail], async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: "Email and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 8);

    const user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();

    res.send({ message: "User was registered successfully!" });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while registering",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.SECRET,
      {
        expiresIn: 86400, // 24 hours
      }
    );

    res.status(200).send({
      id: user._id,
      email: user.email,
      accessToken: token,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});


router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ message: "Please provide email" });
    }

    const checkUser = await User.findOne({ email });

    if (!checkUser) {
      return res
        .status(400)
        .send({ message: "User not found, please register" });
    }

    const token = jwt.sign({ email }, process.env.SECRET, { expiresIn: "1h" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const resetLink = `http://localhost:8000/reset-password/${token}`;
    const receiver = {
      from: "dhearmtk@gmail.com",
      to: email,
      subject: "Password Reset Request",
      html: `<p>Password reset successfully. Click the link below to reset your password:</p>
             <a href="${resetLink}">Reset Password</a>`,
    };

    await transporter.sendMail(receiver);

    return res.status(200).send({
      message: "Password reset email sent successfully",
      accesstoken: token,
    });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong" });
  }
});
router.get("/reset-password/:token", (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).send("Invalid or missing token");
  }
  res.send(`
    <form action="/reset-password/${token}" method="POST">
      <input type="hidden" name="token" value="${token}" />
      <label for="email">Email:</label>
      <input type="email" name="email" id="email" required />
      <label for="password">New Password:</label>
      <input type="password" name="password" id="password" required />
      <button type="submit">Reset Password</button>
    </form>
  `);
});

// Reset Password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { email, password } = req.body;

    if (!password || !email) {
      return res
        .status(400)
        .send({ message: "Please provide email and password" });
    }

    const decoded = jwt.verify(token, process.env.SECRET);

    if (email !== decoded.email) {
      return res.status(400).send({ message: "Invalid email or token" });
    }

    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).send({ message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong" });
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res
        .status(400)
        .send({ message: "Please provide all required fields" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .send({ message: "User not found, please register" });
    }

    const isMatchPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatchPassword) {
      return res
        .status(400)
        .send({ message: "Current password does not match" });
    }

    const newHashPassword = await bcrypt.hash(newPassword, 10);

    user.password = newHashPassword;
    await user.save();

    return res.status(200).send({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong" });
  }
});

export default router;

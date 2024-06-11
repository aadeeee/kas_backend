import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./model/user.js";
import Transaction from "./model/transaction.js";
import Student from "./model/students.js";
import config from "./jwt/authjwt.js";
import auth from "./jwt/verify.js";

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

    res
      .status(200)
      .json({
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
    res
      .status(200)
      .json({
        message: "Transaction deleted successfully!",
        deletedTransaction,
      });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



//Students

// Add Student
router.post('/students', async (req, res) => {
    const { name, phoneNumber } = req.body;
    try {
      const newStudent = new Student({ name, phoneNumber });
      await newStudent.save();
      res.status(201).json({ message: 'Student added successfully!', newStudent });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get All Students
  router.get('/students', async (req, res) => {
    try {
      const students = await Student.find();
      res.status(200).json(students);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete Student by ID
  router.delete('/students/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const deletedStudent = await Student.findByIdAndDelete(id);
      if (!deletedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.status(200).json({ message: 'Student deleted successfully!', deletedStudent });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update Student by ID
  router.put('/students/:id', async (req, res) => {
    const { id } = req.params;
    const { name, phoneNumber } = req.body;
    try {
      const updatedStudent = await Student.findByIdAndUpdate(id, { name, phoneNumber }, { new: true });
      if (!updatedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.status(200).json({ message: 'Student updated successfully!', updatedStudent });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  


//AUTH

//done
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


//done
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
      config.secret,
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

export default router;

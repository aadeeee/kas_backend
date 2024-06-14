import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./model/user.js";
import Transaction from "./model/transaction.js";
import Student from "./model/students.js";
import auth from "./jwt/verify.js";
import nodemailer from "nodemailer";

const router = express.Router();


//Transaction

// (POST)
router.post("/transaction", auth.verifyToken, async (req, res) => {
  const transaction = new Transaction({
    ...req.body,
    userId: req.userId,
  });
  try {
    await transaction.save();
    res.status(201).send(transaction);
  } catch (error) {
    res.status(400).send(error);
  }
});

// (GET)
router.get("/transaction", auth.verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId });
    res.send(transactions);
  } catch (error) {
    res.status(500).send(error);
  }
});

// by ID (GET)
router.get("/transaction/:id", auth.verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!transaction) {
      return res.status(404).send({ message: "Transaction not found" });
    }
    res.send(transaction);
  } catch (error) {
    res.status(500).send(error);
  }
});

//  (PUT)
router.put("/transaction/:id", auth.verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) {
      return res.status(404).send({ message: "Transaction not found" });
    }
    res.send(transaction);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete (DELETE)
router.delete("/transaction/:id", auth.verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!transaction) {
      return res.status(404).send({ message: "Transaction not found" });
    }
    res.send({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});

//Students

// Add Student
router.post("/students", auth.verifyToken, async (req, res) => {
  const student = new Student({
    ...req.body,
    userId: req.userId,
  });
  try {
    await student.save();
    res.status(201).send(student);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get All Students
router.get("/students", auth.verifyToken, async (req, res) => {
  try {
    const students = await Student.find({ userId: req.userId });
    res.send(students);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/students/:id", auth.verifyToken, async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!student) {
      return res.status(404).send({ message: "Student not found" });
    }
    res.send(student);
  } catch (error) {
    res.status(500).send(error);
  }
});
// Delete Student by ID
router.delete("/students/:id", auth.verifyToken, async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!student) {
      return res.status(404).send({ message: "Student not found" });
    }
    res.send({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});
// Update Student by ID
router.put("/students/:id", auth.verifyToken, async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).send({ message: "Student not found" });
    }
    res.send(student);
  } catch (error) {
    res.status(400).send(error);
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
        expiresIn: "24h", 
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

    const token = jwt.sign({ email }, process.env.SECRET, { expiresIn: "300s" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const resetLink = `https://kas-backend.vercel.app/reset-password/${token}`;
    const receiver = {
      from: process.env.EMAIL,
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
    console.error("Error sending email:", error);
    return res.status(500).send({ message: "Something went wrong" });
  }
});

// GET reset password form
router.get("/reset-password/:token", (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).send("Invalid or missing token");
  }

  res.send(`
    <html>
    <head>
      <title>Reset Password</title>
      <style>
    body {
      background-color: #000; 
      color: #fff; 
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center; 
      align-items: center;
      height: 100vh; 
    }

    .container {
      text-align: center; 
      padding: 20px; 
      background-color: #333; 
      border-radius: 8px; 
      width: 300px; 
    }

    input[type="email"],
    input[type="password"],
    button[type="submit"] {
      width: 100%; 
      padding: 10px; 
      margin-bottom: 10px; 
      border: none; 
      border-radius: 4px; 
      font-size: 16px; 
    }

    button[type="submit"] {
      background-color: #4CAF50; 
      color: white;
      cursor: pointer; 
    }

    button[type="submit"]:hover {
      background-color: #45a049; 
    }
  </style>
      <script>
        const resetPassword = async () => {
          const token = "${token}";
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;

          try {
            const response = await fetch(\`/reset-password/\${token}\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
              alert('Password reset successfully');
              document.getElementById('email').value = '';
              document.getElementById('password').value = '';
             
            } else {
              alert(\`Failed to reset password: \${data.message}\`);
            }
          } catch (error) {
            console.error('Error resetting password:', error);
            alert('Failed to reset password. Please try again later.');
          }
        };
      </script>
    </head>
    <body>
      <form onsubmit="event.preventDefault(); resetPassword();">
        <input type="hidden" name="token" value="${token}" />
        <label for="email">Email:</label>
        <input type="email" name="email" id="email" required /><br /><br />
        <label for="password">New Password:</label>
        <input type="password" name="password" id="password" required /><br /><br />
        <button type="submit">Reset Password</button>
      </form>
    </body>
    </html>
  `);
});

// POST reset password
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
    console.error("Error resetting password:", error);
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

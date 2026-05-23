const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail, findUserByAadhaar, toPublicUser } = require("../store");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, aadhaar, password, role } = req.body;

    if (!name || !email || !aadhaar || !password) {
      return res.status(400).json({ error: "Name, email, Aadhaar, and password are required" });
    }

    const existingUser = findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const existingAadhaar = findUserByAadhaar(aadhaar);

    if (existingAadhaar) {
      return res.status(400).json({ error: "Aadhaar already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = String(role || "citizen").toUpperCase() === "ADMIN" ? "ADMIN" : "CITIZEN";

    const user = createUser({
      name,
      email,
      phone: phone || null,
      aadhaar,
      password: hashedPassword,
      role: normalizedRole,
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: toPublicUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { aadhaar, password } = req.body;

    if (!aadhaar || !password) {
      return res.status(400).json({ error: "Aadhaar and password are required" });
    }

    const user = findUserByAadhaar(aadhaar);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user: toPublicUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

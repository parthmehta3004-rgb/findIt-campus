
import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "./db.js";

const router = Router();

function publicUser(row) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    username: row.username ?? null,
    roll_number: row.roll_number ?? null,
  };
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 72
  );
}

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { full_name, email, password, username, roll_number } =
      req.body ?? {};

    const name = typeof full_name === "string" ? full_name.trim() : "";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    const normalizedUsername =
      typeof username === "string" && username.trim()
        ? username.trim()
        : null;

    const normalizedRoll =
      typeof roll_number === "string" && roll_number.trim()
        ? roll_number.trim()
        : null;

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        message: "Full name must be between 2 and 100 characters.",
      });
    }

    if (!validEmail(normalizedEmail) || normalizedEmail.length > 150) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    if (!validPassword(password)) {
      return res.status(400).json({
        message: "Password must be 8–72 characters long.",
      });
    }

    if (normalizedUsername && normalizedUsername.length > 20) {
      return res.status(400).json({
        message: "Username must be at most 20 characters.",
      });
    }

    if (normalizedRoll && normalizedRoll.length > 30) {
      return res.status(400).json({
        message: "Roll number must be at most 30 characters.",
      });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existing.length) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Check optional unique columns before insert.
    if (normalizedUsername) {
      const [rows] = await pool.execute(
        "SELECT id FROM users WHERE username = ? LIMIT 1",
        [normalizedUsername]
      );

      if (rows.length) {
        return res.status(409).json({
          message: "This username is already taken.",
        });
      }
    }

    if (normalizedRoll) {
      const [rows] = await pool.execute(
        "SELECT id FROM users WHERE roll_number = ? LIMIT 1",
        [normalizedRoll]
      );

      if (rows.length) {
        return res.status(409).json({
          message: "This roll number is already registered.",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users
        (full_name, email, password_hash, username, roll_number)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        normalizedEmail,
        passwordHash,
        normalizedUsername,
        normalizedRoll,
      ]
    );

    // Create a server-side session after signup.
    req.session.userId = result.insertId;

    req.session.save((error) => {
      if (error) {
        console.error("Session save error:", error.message);
        return res.status(500).json({
          message: "Account created, but session could not be started. Please log in.",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Account created successfully.",
        user: {
          id: result.insertId,
          full_name: name,
          email: normalizedEmail,
          username: normalizedUsername,
          roll_number: normalizedRoll,
        },
      });
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email, username, or roll number is already registered.",
      });
    }

    console.error("Signup error:", error.message);
    return res.status(500).json({
      message: "Unable to create account right now.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (
      !validEmail(normalizedEmail) ||
      typeof password !== "string" ||
      !password.length
    ) {
      return res.status(400).json({
        message: "Enter a valid email and password.",
      });
    }

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, password_hash, username, roll_number
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    if (!rows.length) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Prevent session fixation.
    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regenerate error:", error.message);
        return res.status(500).json({
          message: "Unable to start a session.",
        });
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError.message);
          return res.status(500).json({
            message: "Unable to save login session.",
          });
        }

        return res.json({
          success: true,
          message: "Login successful.",
          user: publicUser(user),
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      message: "Unable to log in right now.",
    });
  }
});

// CURRENT USER
router.get("/me", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({
        authenticated: false,
        message: "Please log in.",
      });
    }

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, username, roll_number
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.session.userId]
    );

    if (!rows.length) {
      return req.session.destroy(() => {
        res.clearCookie("findit.sid");
        res.status(401).json({
          authenticated: false,
          message: "User account no longer exists.",
        });
      });
    }

    return res.json({
      authenticated: true,
      user: publicUser(rows[0]),
    });
  } catch (error) {
    console.error("Current-user error:", error.message);
    return res.status(500).json({
      message: "Unable to verify session.",
    });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  if (!req.session) {
    res.clearCookie("findit.sid");
    return res.json({ success: true, message: "Logged out." });
  }

  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error.message);
      return res.status(500).json({
        message: "Unable to log out.",
      });
    }

    res.clearCookie("findit.sid");
    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  });
});

export default router;

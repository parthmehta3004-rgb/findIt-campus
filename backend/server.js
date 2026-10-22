
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import session from "express-session";
// import bcrypt from "bcrypt";
// import multer from "multer";
// import path from "node:path";
// import fs from "node:fs";
// import { randomUUID } from "node:crypto";
// import { fileURLToPath } from "node:url";
// import pool from "./db.js";

// dotenv.config();

// const app = express();
// const PORT = Number(process.env.PORT) || 3000;

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const uploadDir = path.join(__dirname, "uploads");

// fs.mkdirSync(uploadDir, { recursive: true });

// /* ================ MIDDLEWARE ================ */

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     credentials: true,
//   })
// );

// app.use(express.json({ limit: "1mb" }));
// app.use(express.urlencoded({ extended: true }));

// app.use(
//   session({
//     name: "findit.sid",
//     secret:
//       process.env.SESSION_SECRET ||
//       "findit-development-secret-change-this",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       maxAge: 24 * 60 * 60 * 1000,
//     },
//   })
// );

// app.use("/uploads", express.static(uploadDir));

// /* ================ IMAGE UPLOAD ================ */

// const storage = multer.diskStorage({
//   destination: (_req, _file, callback) => {
//     callback(null, uploadDir);
//   },

//   filename: (_req, file, callback) => {
//     const extension = path.extname(file.originalname).toLowerCase();
//     const allowed = [".jpg", ".jpeg", ".png", ".webp"];

//     if (!allowed.includes(extension)) {
//       return callback(
//         new Error("Only JPG, JPEG, PNG and WEBP images are allowed.")
//       );
//     }

//     callback(null, `${randomUUID()}${extension}`);
//   },
// });

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024,
//     files: 1,
//   },
//   fileFilter: (_req, file, callback) => {
//     const allowed = ["image/jpeg", "image/png", "image/webp"];

//     if (!allowed.includes(file.mimetype)) {
//       const error = new Error("Only JPG, PNG and WEBP images are allowed.");
//       error.status = 400;
//       return callback(error);
//     }

//     callback(null, true);
//   },
// });

// /* ================ HELPER FUNCTIONS ================ */

// function requireAuth(req, res, next) {
//   if (!req.session?.userId) {
//     return res.status(401).json({
//       success: false,
//       message: "Please login first.",
//     });
//   }

//   next();
// }

// function publicUser(user) {
//   return {
//     id: user.id,
//     full_name: user.full_name,
//     email: user.email,
//     username: user.username,
//     roll_number: user.roll_number,
//     profile_image: user.profile_image || null,
//   };
// }

// function saveSession(req, user, res, message = "Login successful.") {
//   req.session.userId = user.id;

//   req.session.save((error) => {
//     if (error) {
//       console.error("Session save error:", error.message);

//       return res.status(500).json({
//         success: false,
//         message: "Could not create login session.",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message,
//       user: publicUser(user),
//     });
//   });
// }

// function isValidEmail(email) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
//     String(email || "").trim()
//   );
// }

// function isValidDate(date) {
//   if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
//     return false;
//   }

//   const parsed = new Date(`${date}T00:00:00Z`);

//   return (
//     !Number.isNaN(parsed.getTime()) &&
//     parsed.toISOString().slice(0, 10) === date
//   );
// }

// function deleteUploadedFile(filePath) {
//   if (filePath && fs.existsSync(filePath)) {
//     fs.unlink(filePath, (error) => {
//       if (error) {
//         console.error("Could not delete uploaded file:", error.message);
//       }
//     });
//   }
// }

// /* ================ HEALTH CHECKS ================ */

// app.get("/", (_req, res) => {
//   res.json({
//     success: true,
//     message: "FindIt@Campus backend is running.",
//   });
// });

// app.get("/api/health/db", async (_req, res) => {
//   try {
//     const [rows] = await pool.query("SELECT DATABASE() AS db");

//     res.json({
//       success: true,
//       message: "MySQL connected successfully.",
//       database: rows[0]?.db ?? null,
//     });
//   } catch (error) {
//     console.error("Database connection error:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "Database connection failed.",
//     });
//   }
// });

// /* ================ SIGNUP ================ */

// app.post(
//   "/api/auth/signup",
//   upload.single("profile_image"),
//   async (req, res) => {
//     const uploadedFile = req.file?.path;

//     try {
//       const fullName = String(req.body.full_name || "").trim();
//       const email = String(req.body.email || "").trim().toLowerCase();
//       const password = String(req.body.password || "");
//       const username = String(req.body.username || "").trim();
//       const rollNumber = String(req.body.roll_number || "").trim();

//       if (!fullName || !email || !password || !username || !rollNumber) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message:
//             "Full name, email, username, roll number and password are required.",
//         });
//       }

//       if (fullName.length < 2 || fullName.length > 100) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Full name must be between 2 and 100 characters.",
//         });
//       }

//       if (!isValidEmail(email) || email.length > 150) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Enter a valid email address.",
//         });
//       }

//       if (
//         username.length < 3 ||
//         username.length > 20 ||
//         !/^[a-zA-Z0-9_.]+$/.test(username)
//       ) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Enter a valid username.",
//         });
//       }

//       if (rollNumber.length > 30) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Roll number cannot exceed 30 characters.",
//         });
//       }

//       if (password.length < 8 || password.length > 72) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Password must be between 8 and 72 characters.",
//         });
//       }

//       if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Password must contain at least one letter and one number.",
//         });
//       }

//       if (!req.file) {
//         return res.status(400).json({
//           success: false,
//           message: "Profile photo is required for signup.",
//         });
//       }

//       const [existingUsers] = await pool.execute(
//         `SELECT id FROM users
//          WHERE email = ? OR username = ? OR roll_number = ?
//          LIMIT 1`,
//         [email, username, rollNumber]
//       );

//       if (existingUsers.length > 0) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(409).json({
//           success: false,
//           message: "Email, username or roll number is already registered.",
//         });
//       }

//       const passwordHash = await bcrypt.hash(password, 12);
//       const profileImage = `/uploads/${req.file.filename}`;

//       const [result] = await pool.execute(
//         `INSERT INTO users
//           (full_name, email, password_hash, username, roll_number, profile_image)
//          VALUES (?, ?, ?, ?, ?, ?)`,
//         [
//           fullName,
//           email,
//           passwordHash,
//           username,
//           rollNumber,
//           profileImage,
//         ]
//       );

//       const user = {
//         id: result.insertId,
//         full_name: fullName,
//         email,
//         username,
//         roll_number: rollNumber,
//         profile_image: profileImage,
//       };

//       // Signup ke baad user automatically logged in hoga.
//       req.session.regenerate((error) => {
//         if (error) {
//           console.error("Session regeneration error:", error.message);

//           return res.status(500).json({
//             success: false,
//             message: "Account created, but login session could not be created.",
//           });
//         }

//         saveSession(req, user, res, "Account created successfully.");
//       });
//     } catch (error) {
//       deleteUploadedFile(uploadedFile);
//       console.error("Signup error:", error.message);

//       if (error.code === "ER_DUP_ENTRY") {
//         return res.status(409).json({
//           success: false,
//           message: "Email, username or roll number is already registered.",
//         });
//       }

//       res.status(500).json({
//         success: false,
//         message: "Signup failed. Check users table and database configuration.",
//       });
//     }
//   }
// );

// /* ================ LOGIN ================ */

// app.post("/api/auth/login", async (req, res) => {
//   try {
//     const identifier = String(
//       req.body?.identifier ||
//         req.body?.email ||
//         req.body?.username ||
//         ""
//     )
//       .trim()
//       .toLowerCase();

//     const password = String(req.body?.password || "");

//     if (!identifier || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email/username and password are required.",
//       });
//     }

//     const [users] = await pool.execute(
//       `SELECT id, full_name, email, password_hash, username,
//               roll_number, profile_image
//        FROM users
//        WHERE LOWER(email) = ? OR LOWER(username) = ?
//        LIMIT 1`,
//       [identifier, identifier]
//     );

//     if (!users.length) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email/username or password.",
//       });
//     }

//     const user = users[0];
//     const matches = await bcrypt.compare(password, user.password_hash);

//     if (!matches) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email/username or password.",
//       });
//     }

//     req.session.regenerate((error) => {
//       if (error) {
//         console.error("Session regeneration error:", error.message);

//         return res.status(500).json({
//           success: false,
//           message: "Could not create login session.",
//         });
//       }

//       saveSession(req, user, res);
//     });
//   } catch (error) {
//     console.error("Login error:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "Login failed.",
//     });
//   }
// });

// /* ================ CURRENT USER ================ */

// app.get("/api/auth/me", async (req, res) => {
//   try {
//     if (!req.session?.userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Not logged in.",
//       });
//     }

//     const [users] = await pool.execute(
//       `SELECT id, full_name, email, username, roll_number, profile_image
//        FROM users
//        WHERE id = ?
//        LIMIT 1`,
//       [req.session.userId]
//     );

//     if (!users.length) {
//       req.session.destroy(() => {});

//       return res.status(401).json({
//         success: false,
//         message: "User account not found.",
//       });
//     }

//     res.json({
//       success: true,
//       user: publicUser(users[0]),
//     });
//   } catch (error) {
//     console.error("Auth check error:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "Could not verify login.",
//     });
//   }
// });

// /* ================ UPDATE PROFILE ================ */

// app.put(
//   "/api/profile",
//   requireAuth,
//   upload.single("profile_image"),
//   async (req, res) => {
//     const uploadedFile = req.file?.path;

//     try {
//       const fullName = String(req.body.full_name || "").trim();
//       const username = String(req.body.username || "").trim();
//       const rollNumber = String(req.body.roll_number || "").trim();

//       if (fullName.length < 2 || fullName.length > 100) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Full name must be between 2 and 100 characters.",
//         });
//       }

//       if (
//         username.length < 3 ||
//         username.length > 20 ||
//         !/^[a-zA-Z0-9_.]+$/.test(username)
//       ) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Enter a valid username.",
//         });
//       }

//       if (!rollNumber || rollNumber.length > 30) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Enter a valid roll number.",
//         });
//       }

//       const [currentRows] = await pool.execute(
//         `SELECT id, full_name, email, username, roll_number, profile_image
//          FROM users
//          WHERE id = ?
//          LIMIT 1`,
//         [req.session.userId]
//       );

//       if (!currentRows.length) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(404).json({
//           success: false,
//           message: "User account not found.",
//         });
//       }

//       const currentUser = currentRows[0];

//       const [duplicates] = await pool.execute(
//         `SELECT id FROM users
//          WHERE username = ? AND id <> ?
//          LIMIT 1`,
//         [username, req.session.userId]
//       );

//       if (duplicates.length > 0) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(409).json({
//           success: false,
//           message: "This username is already taken.",
//         });
//       }

//       const profileImage = req.file
//         ? `/uploads/${req.file.filename}`
//         : currentUser.profile_image;

//       await pool.execute(
//         `UPDATE users
//          SET full_name = ?, username = ?, roll_number = ?, profile_image = ?
//          WHERE id = ?`,
//         [
//           fullName,
//           username,
//           rollNumber,
//           profileImage,
//           req.session.userId,
//         ]
//       );

//       // Database update successful hone ke baad purani photo remove karo.
//       if (req.file && currentUser.profile_image) {
//         const oldName = path.basename(currentUser.profile_image);
//         const newName = path.basename(profileImage);

//         if (oldName !== newName) {
//           deleteUploadedFile(path.join(uploadDir, oldName));
//         }
//       }

//       const updatedUser = {
//         id: currentUser.id,
//         full_name: fullName,
//         email: currentUser.email,
//         username,
//         roll_number: rollNumber,
//         profile_image: profileImage || null,
//       };

//       res.json({
//         success: true,
//         message: "Profile updated successfully.",
//         user: updatedUser,
//       });
//     } catch (error) {
//       deleteUploadedFile(uploadedFile);
//       console.error("Update profile error:", error.message);

//       if (error.code === "ER_DUP_ENTRY") {
//         return res.status(409).json({
//           success: false,
//           message: "This username is already taken.",
//         });
//       }

//       res.status(500).json({
//         success: false,
//         message: "Failed to update profile.",
//       });
//     }
//   }
// );

// /* ================ LOGOUT ================ */

// app.post("/api/auth/logout", (req, res) => {
//   if (!req.session) {
//     return res.json({
//       success: true,
//       message: "Logged out successfully.",
//     });
//   }

//   req.session.destroy((error) => {
//     if (error) {
//       console.error("Logout error:", error.message);

//       return res.status(500).json({
//         success: false,
//         message: "Logout failed.",
//       });
//     }

//     res.clearCookie("findit.sid", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//     });

//     res.json({
//       success: true,
//       message: "Logged out successfully.",
//     });
//   });
// });

// /* ================ LOST ITEMS: GET ALL ================ */

// app.get("/api/lost-items", async (_req, res) => {
//   try {
//     const [rows] = await pool.query(
//       `SELECT id, user_id, item_name, category, description, location,
//               date_lost, image_url, created_at
//        FROM lost_items
//        ORDER BY created_at DESC`
//     );

//     res.json(rows);
//   } catch (error) {
//     console.error("Fetch lost items error:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch lost items.",
//     });
//   }
// });

// /* ================ LOST ITEMS: CREATE ================ */

// app.post(
//   "/api/lost-items",
//   requireAuth,
//   upload.single("image"),
//   async (req, res) => {
//     const uploadedFile = req.file?.path;

//     try {
//       const {
//         item_name,
//         category,
//         description,
//         location,
//         date_lost,
//         contact,
//       } = req.body;

//       if (
//         !item_name?.trim() ||
//         !category?.trim() ||
//         !description?.trim() ||
//         !location?.trim() ||
//         !contact?.trim()
//       ) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message:
//             "Item name, category, description, location and contact are required.",
//         });
//       }

//       if (!isValidDate(date_lost)) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Enter a valid lost date in YYYY-MM-DD format.",
//         });
//       }

//       const imageUrl = req.file
//         ? `/uploads/${req.file.filename}`
//         : null;

//       const [result] = await pool.execute(
//         `INSERT INTO lost_items
//           (user_id, item_name, category, description, location,
//            date_lost, contact, image_url)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           req.session.userId,
//           item_name.trim(),
//           category.trim(),
//           description.trim(),
//           location.trim(),
//           date_lost,
//           contact.trim(),
//           imageUrl,
//         ]
//       );

//       res.status(201).json({
//         success: true,
//         message: "Lost item reported successfully.",
//         id: result.insertId,
//         image_url: imageUrl,
//       });
//     } catch (error) {
//       deleteUploadedFile(uploadedFile);
//       console.error("Create lost item error:", error.message);

//       res.status(500).json({
//         success: false,
//         message: "Failed to save lost item.",
//       });
//     }
//   }
// );

// /* ================ FOUND ITEMS: GET ALL ================ */

// app.get("/api/found-items", async (_req, res) => {
//   try {
//     const [rows] = await pool.query(
//       `SELECT id, user_id, item_name, category, description, location,
//               date_found, image_url, created_at
//        FROM found_items
//        ORDER BY created_at DESC`
//     );

//     res.json(rows);
//   } catch (error) {
//     console.error("Fetch found items error:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch found items.",
//     });
//   }
// });



// /* ================ AI ITEM MATCHING ================ */

// app.get("/api/ai-matches/lost/:id", async (req, res) => {
//   try {
//     const lostItemId = Number(req.params.id);

//     if (!Number.isInteger(lostItemId) || lostItemId <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid lost item ID.",
//       });
//     }

//     const apiKey = process.env.OPENROUTER_API_KEY;

//     if (!apiKey) {
//       return res.status(500).json({
//         success: false,
//         message: "OpenRouter API key is not configured.",
//       });
//     }

//     // Step 1: Fetch the lost item.
//     const [lostRows] = await pool.execute(
//       `SELECT id, item_name, category, description, location, date_lost
//        FROM lost_items
//        WHERE id = ?
//        LIMIT 1`,
//       [lostItemId]
//     );

//     if (lostRows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Lost item not found.",
//       });
//     }

//     const lostItem = lostRows[0];

//     // Step 2: Fetch active found items from the same category.
//     const [foundItems] = await pool.execute(
//       `SELECT id, item_name, category, description, location, date_found
//        FROM found_items
//        WHERE LOWER(TRIM(category)) = LOWER(TRIM(?))
//          AND LOWER(status) = 'active'
//        ORDER BY created_at DESC
//        LIMIT 20`,
//       [lostItem.category]
//     );

//     if (foundItems.length === 0) {
//       return res.json({
//         success: true,
//         lostItem,
//         matches: [],
//         message: "No active found items in this category.",
//       });
//     }

//     // Step 3: Ask the OpenRouter free model to compare descriptions.
//     const response = await fetch(
//       "https://openrouter.ai/api/v1/chat/completions",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${apiKey}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           model: "nvidia/nemotron-3.5-lightning:free",
//           messages: [
//             {
//               role: "system",
//               content: `You compare lost and found item descriptions.
// Return only valid JSON in this format:
// {
//   "matches": [
//     {
//       "found_item_id": 1,
//       "is_possible_match": true,
//       "reason": "Short explanation"
//     }
//   ]
// }
// Compare item meaning, name, description and location.
// Only include plausible matches.
// Never claim certainty. Do not invent item IDs.
// Use only the supplied found item IDs.`,
//             },
//             {
//               role: "user",
//               content: JSON.stringify({
//                 lost_item: lostItem,
//                 found_items: foundItems,
//               }),
//             },
//           ],
//         }),
//       }
//     );

//     const data = await response.json();

//     if (!response.ok) {
//       console.error("OpenRouter error:", response.status, data);

//       return res.status(502).json({
//         success: false,
//         message: "AI matching service failed.",
//         providerStatus: response.status,
//       });
//     }

//     const aiText = data.choices?.[0]?.message?.content;

//     if (typeof aiText !== "string" || !aiText.trim()) {
//       return res.status(502).json({
//         success: false,
//         message: "AI returned an empty response.",
//       });
//     }

//     // Handle a JSON response, including optional Markdown fences.
//     const cleanedText = aiText
//       .replace(/^```(?:json)?\s*/i, "")
//       .replace(/\s*```$/, "")
//       .trim();

//     let aiResult;

//     try {
//       aiResult = JSON.parse(cleanedText);
//     } catch {
//       console.error("Invalid AI JSON response:", aiText);

//       return res.status(502).json({
//         success: false,
//         message: "AI returned an invalid response format.",
//       });
//     }

//     // Only return IDs that actually exist in our candidate list.
//     const candidateById = new Map(
//       foundItems.map((item) => [Number(item.id), item])
//     );

//     const seenIds = new Set();

//     const matches = (Array.isArray(aiResult.matches)
//       ? aiResult.matches
//       : [])
//       .filter((match) => {
//         const id = Number(match.found_item_id);

//         if (
//           match.is_possible_match !== true ||
//           !candidateById.has(id) ||
//           seenIds.has(id)
//         ) {
//           return false;
//         }

//         seenIds.add(id);
//         return true;
//       })
//       .map((match) => ({
//         ...candidateById.get(Number(match.found_item_id)),
//         reason:
//           typeof match.reason === "string"
//             ? match.reason.slice(0, 500)
//             : "Potential match based on item details.",
//       }));

//     return res.json({
//       success: true,
//       lostItem,
//       matches,
//       message:
//         matches.length > 0
//           ? "Possible matches found."
//           : "No possible matches found.",
//     });
//   } catch (error) {
//     console.error("AI matching error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to find AI matches.",
//     });
//   }
// });


// /* ================ FOUND ITEMS: CREATE ================ */

// app.post(
//   "/api/found-items",
//   requireAuth,
//   upload.single("image"),
//   async (req, res) => {
//     const uploadedFile = req.file?.path;

//     try {
//       const {
//         item_name,
//         category,
//         description,
//         location,
//         date_found,
//         contact,
//       } = req.body;

//       if (
//         !item_name?.trim() ||
//         !category?.trim() ||
//         !description?.trim() ||
//         !location?.trim() ||
//         !contact?.trim()
//       ) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message:
//             "Item name, category, description, location and contact are required.",
//         });
//       }

//       if (!isValidDate(date_found)) {
//         deleteUploadedFile(uploadedFile);

//         return res.status(400).json({
//           success: false,
//           message: "Enter a valid found date in YYYY-MM-DD format.",
//         });
//       }

//       const imageUrl = req.file
//         ? `/uploads/${req.file.filename}`
//         : null;

//       const [result] = await pool.execute(
//         `INSERT INTO found_items
//           (user_id, item_name, category, description, location,
//            date_found, contact, image_url)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           req.session.userId,
//           item_name.trim(),
//           category.trim(),
//           description.trim(),
//           location.trim(),
//           date_found,
//           contact.trim(),
//           imageUrl,
//         ]
//       );

//       res.status(201).json({
//         success: true,
//         message: "Found item reported successfully.",
//         id: result.insertId,
//         image_url: imageUrl,
//       });
//     } catch (error) {
//       deleteUploadedFile(uploadedFile);
//       console.error("Create found item error:", error.message);

//       res.status(500).json({
//         success: false,
//         message: "Failed to save found item.",
//       });
//     }
//   }
// );

// /* ================ CLAIMS: CREATE ================ */

// app.post("/api/claims", requireAuth, async (req, res) => {
//   try {
//     const { lost_item_id, found_item_id, answers } = req.body ?? {};

//     const lostId = Number(lost_item_id);
//     const foundId = Number(found_item_id);

//     if (
//       !Number.isInteger(lostId) ||
//       lostId <= 0 ||
//       !Number.isInteger(foundId) ||
//       foundId <= 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid lost_item_id and found_item_id are required.",
//       });
//     }

//     if (
//       !Array.isArray(answers) ||
//       answers.length !== 3 ||
//       answers.some(
//         (answer) =>
//           !answer?.question ||
//           !String(answer?.answer ?? "").trim()
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Please answer all three ownership questions.",
//       });
//     }

//     const [lostRows] = await pool.execute(
//       "SELECT id FROM lost_items WHERE id = ? LIMIT 1",
//       [lostId]
//     );

//     const [foundRows] = await pool.execute(
//       "SELECT id FROM found_items WHERE id = ? LIMIT 1",
//       [foundId]
//     );

//     if (!lostRows.length || !foundRows.length) {
//       return res.status(404).json({
//         success: false,
//         message: "The selected lost or found item does not exist.",
//       });
//     }

//     const [existingClaims] = await pool.execute(
//       `SELECT id FROM claims
//        WHERE lost_item_id = ?
//          AND found_item_id = ?
//          AND status = 'Pending'
//        LIMIT 1`,
//       [lostId, foundId]
//     );

//     if (existingClaims.length) {
//       return res.status(409).json({
//         success: false,
//         message: "A pending claim already exists for this item pair.",
//       });
//     }

//     const safeAnswers = answers.map((answer) => ({
//       question: String(answer.question).trim(),
//       answer: String(answer.answer).trim(),
//     }));

//     const reason = safeAnswers
//       .map((answer) => `${answer.question}: ${answer.answer}`)
//       .join("\n");

//     const [result] = await pool.execute(
//       `INSERT INTO claims
//         (claimant_user_id, lost_item_id, found_item_id, answers, reason, status)
//        VALUES (?, ?, ?, ?, ?, 'Pending')`,
//       [
//         req.session.userId,
//         lostId,
//         foundId,
//         JSON.stringify(safeAnswers),
//         reason,
//       ]
//     );

//     res.status(201).json({
//       success: true,
//       message: "Claim submitted successfully.",
//       claim_id: result.insertId,
//       status: "Pending",
//     });
//   } catch (error) {
//     console.error("Create claim error:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "Failed to save claim. Check the claims table structure.",
//     });
//   }
// });

// /* ================ CLAIMS: GET ALL ================ */

// // app.get("/api/claims", requireAuth, async (_req, res) => {
// //   try {
// //     const [rows] = await pool.query(
// //       `SELECT id, claimant_user_id, lost_item_id, found_item_id,
// //               answers, reason, status, created_at
// //        FROM claims
// //        ORDER BY created_at DESC`
// //     );

// //     res.json(rows);
// //   } catch (error) {
// //     console.error("Fetch claims error:", error.message);

// //     res.status(500).json({
// //       success: false,
// //       message: "Failed to fetch claims.",
// //     });
// //   }
// // });

// /* ---------------- CLAIMS: GET RELATED CLAIMS ---------------- */

// app.get("/api/claims", requireAuth, async (req, res) => {
//   try {
//     const [rows] = await pool.execute(
//       `SELECT
//           c.id,
//           c.claimant_user_id,
//           c.lost_item_id,
//           c.found_item_id,
//           c.answers,
//           c.reason,
//           c.status,
//           c.created_at,
//           l.item_name AS lost_item_name,
//           l.user_id AS lost_owner_id,
//           f.item_name AS found_item_name,
//           f.user_id AS found_owner_id,
//           claimant.full_name AS claimant_name,
//           found_owner.full_name AS found_owner_name
//        FROM claims c
//        JOIN lost_items l ON l.id = c.lost_item_id
//        JOIN found_items f ON f.id = c.found_item_id
//        LEFT JOIN users claimant ON claimant.id = c.claimant_user_id
//        LEFT JOIN users found_owner ON found_owner.id = f.user_id
//        WHERE c.claimant_user_id = ?
//           OR l.user_id = ?
//           OR f.user_id = ?
//        ORDER BY c.created_at DESC`,
//       [req.session.userId, req.session.userId, req.session.userId]
//     );

//     res.json(rows);
//   } catch (error) {
//     console.error("Fetch claims error:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch claims.",
//     });
//   }
// });


// /* ---------------- CLAIMS: APPROVE OR REJECT ---------------- */

// app.patch("/api/claims/:id/decision", requireAuth, async (req, res) => {
//   try {
//     const claimId = Number(req.params.id);
//     const decision = String(req.body?.status || "").toLowerCase();

//     if (!Number.isInteger(claimId) || claimId <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid claim ID.",
//       });
//     }

//     if (!["approved", "rejected"].includes(decision)) {
//       return res.status(400).json({
//         success: false,
//         message: "Status must be approved or rejected.",
//       });
//     }

//     // Only the user who reported the found item can decide.
//     const [claims] = await pool.execute(
//       `SELECT c.id, c.status, f.user_id AS found_owner_id
//        FROM claims c
//        JOIN found_items f ON f.id = c.found_item_id
//        WHERE c.id = ?
//        LIMIT 1`,
//       [claimId]
//     );

//     if (!claims.length) {
//       return res.status(404).json({
//         success: false,
//         message: "Claim not found.",
//       });
//     }

//     const claim = claims[0];

//     if (Number(claim.found_owner_id) !== Number(req.session.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: "Only the found-item reporter can review this claim.",
//       });
//     }

//     if (String(claim.status).toLowerCase() !== "pending") {
//       return res.status(409).json({
//         success: false,
//         message: "Only pending claims can be reviewed.",
//       });
//     }

//     const [result] = await pool.execute(
//       `UPDATE claims
//        SET status = ?
//        WHERE id = ? AND LOWER(status) = 'pending'`,
//       [decision, claimId]
//     );

//     if (result.affectedRows !== 1) {
//       return res.status(409).json({
//         success: false,
//         message: "Claim status changed. Refresh and try again.",
//       });
//     }

//     res.json({
//       success: true,
//       message: `Claim ${decision} successfully.`,
//       claim_id: claimId,
//       status: decision,
//     });
//   } catch (error) {
//     console.error("Claim decision error:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update claim status.",
//     });
//   }
// });

// /* ================ UNKNOWN API ROUTE ================ */

// app.use("/api", (_req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "API route not found.",
//   });
// });

// /* ================ GLOBAL ERROR HANDLER ================ */

// app.use((error, _req, res, _next) => {
//   console.error("Request error:", error.message);

//   if (error instanceof multer.MulterError) {
//     if (error.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({
//         success: false,
//         message: "Image size must be 5 MB or less.",
//       });
//     }

//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }

//   if (error.status === 400) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }

//   res.status(500).json({
//     success: false,
//     message: "Internal server error.",
//   });
// });

// /* ================ START SERVER ================ */

// app.listen(PORT, () => {
//   console.log(
//     `FindIt@Campus backend running at http://localhost:${PORT}`
//   );
// });






import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

/* ================ MIDDLEWARE ================ */

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "findit.sid",
    secret:
      process.env.SESSION_SECRET ||
      "findit-development-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/uploads", express.static(uploadDir));

/* ================ IMAGE UPLOAD ================ */

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];

    if (!allowed.includes(extension)) {
      return callback(
        new Error("Only JPG, JPEG, PNG and WEBP images are allowed.")
      );
    }

    callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      const error = new Error("Only JPG, PNG and WEBP images are allowed.");
      error.status = 400;
      return callback(error);
    }

    callback(null, true);
  },
});

/* ================ HELPER FUNCTIONS ================ */

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      message: "Please login first.",
    });
  }

  next();
}

function publicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    username: user.username,
    roll_number: user.roll_number,
    profile_image: user.profile_image || null,
  };
}

function saveSession(req, user, res, message = "Login successful.") {
  req.session.userId = user.id;

  req.session.save((error) => {
    if (error) {
      console.error("Session save error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not create login session.",
      });
    }

    res.status(200).json({
      success: true,
      message,
      user: publicUser(user),
    });
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || "").trim()
  );
}

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function deleteUploadedFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error("Could not delete uploaded file:", error.message);
      }
    });
  }
}

/* ================ HEALTH CHECKS ================ */

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "FindIt@Campus backend is running.",
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS db");

    res.json({
      success: true,
      message: "MySQL connected successfully.",
      database: rows[0]?.db ?? null,
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed.",
    });
  }
});

/* ================ SIGNUP ================ */

app.post(
  "/api/auth/signup",
  upload.single("profile_image"),
  async (req, res) => {
    const uploadedFile = req.file?.path;

    try {
      const fullName = String(req.body.full_name || "").trim();
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      const username = String(req.body.username || "").trim();
      const rollNumber = String(req.body.roll_number || "").trim();

      if (!fullName || !email || !password || !username || !rollNumber) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message:
            "Full name, email, username, roll number and password are required.",
        });
      }

      if (fullName.length < 2 || fullName.length > 100) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Full name must be between 2 and 100 characters.",
        });
      }

      if (!isValidEmail(email) || email.length > 150) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Enter a valid email address.",
        });
      }

      if (
        username.length < 3 ||
        username.length > 20 ||
        !/^[a-zA-Z0-9_.]+$/.test(username)
      ) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Enter a valid username.",
        });
      }

      if (rollNumber.length > 30) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Roll number cannot exceed 30 characters.",
        });
      }

      if (password.length < 8 || password.length > 72) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Password must be between 8 and 72 characters.",
        });
      }

      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Password must contain at least one letter and one number.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Profile photo is required for signup.",
        });
      }

      const [existingUsers] = await pool.execute(
        `SELECT id FROM users
         WHERE email = ? OR username = ? OR roll_number = ?
         LIMIT 1`,
        [email, username, rollNumber]
      );

      if (existingUsers.length > 0) {
        deleteUploadedFile(uploadedFile);

        return res.status(409).json({
          success: false,
          message: "Email, username or roll number is already registered.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const profileImage = `/uploads/${req.file.filename}`;

      const [result] = await pool.execute(
        `INSERT INTO users
          (full_name, email, password_hash, username, roll_number, profile_image)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          fullName,
          email,
          passwordHash,
          username,
          rollNumber,
          profileImage,
        ]
      );

      const user = {
        id: result.insertId,
        full_name: fullName,
        email,
        username,
        roll_number: rollNumber,
        profile_image: profileImage,
      };

      req.session.regenerate((error) => {
        if (error) {
          console.error("Session regeneration error:", error.message);

          return res.status(500).json({
            success: false,
            message: "Account created, but login session could not be created.",
          });
        }

        saveSession(req, user, res, "Account created successfully.");
      });
    } catch (error) {
      deleteUploadedFile(uploadedFile);
      console.error("Signup error:", error.message);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "Email, username or roll number is already registered.",
        });
      }

      res.status(500).json({
        success: false,
        message: "Signup failed. Check users table and database configuration.",
      });
    }
  }
);

/* ================ LOGIN ================ */

app.post("/api/auth/login", async (req, res) => {
  try {
    const identifier = String(
      req.body?.identifier ||
        req.body?.email ||
        req.body?.username ||
        ""
    )
      .trim()
      .toLowerCase();

    const password = String(req.body?.password || "");

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required.",
      });
    }

    const [users] = await pool.execute(
      `SELECT id, full_name, email, password_hash, username,
              roll_number, profile_image
       FROM users
       WHERE LOWER(email) = ? OR LOWER(username) = ?
       LIMIT 1`,
      [identifier, identifier]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    const user = users[0];
    const matches = await bcrypt.compare(password, user.password_hash);

    if (!matches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regeneration error:", error.message);

        return res.status(500).json({
          success: false,
          message: "Could not create login session.",
        });
      }

      saveSession(req, user, res);
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

/* ================ CURRENT USER ================ */

app.get("/api/auth/me", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({
        success: false,
        message: "Not logged in.",
      });
    }

    const [users] = await pool.execute(
      `SELECT id, full_name, email, username, roll_number, profile_image
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.session.userId]
    );

    if (!users.length) {
      req.session.destroy(() => {});

      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    res.json({
      success: true,
      user: publicUser(users[0]),
    });
  } catch (error) {
    console.error("Auth check error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not verify login.",
    });
  }
});
/* ================ UPDATE PROFILE ================ */

app.put(
  "/api/profile",
  requireAuth,
  upload.single("profile_image"),
  async (req, res) => {
    const uploadedFile = req.file?.path;

    try {
      const fullName = String(req.body.full_name || "").trim();
      const username = String(req.body.username || "").trim();
      const rollNumber = String(req.body.roll_number || "").trim();

      if (fullName.length < 2 || fullName.length > 100) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Full name must be between 2 and 100 characters.",
        });
      }

      if (
        username.length < 3 ||
        username.length > 20 ||
        !/^[a-zA-Z0-9_.]+$/.test(username)
      ) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Enter a valid username.",
        });
      }

      if (!rollNumber || rollNumber.length > 30) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Enter a valid roll number.",
        });
      }

      const [currentRows] = await pool.execute(
        `SELECT id, full_name, email, username, roll_number, profile_image
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [req.session.userId]
      );

      if (!currentRows.length) {
        deleteUploadedFile(uploadedFile);

        return res.status(404).json({
          success: false,
          message: "User account not found.",
        });
      }

      const currentUser = currentRows[0];

      const [duplicates] = await pool.execute(
        `SELECT id FROM users
         WHERE username = ? AND id <> ?
         LIMIT 1`,
        [username, req.session.userId]
      );

      if (duplicates.length > 0) {
        deleteUploadedFile(uploadedFile);

        return res.status(409).json({
          success: false,
          message: "This username is already taken.",
        });
      }

      const profileImage = req.file
        ? `/uploads/${req.file.filename}`
        : currentUser.profile_image;

      await pool.execute(
        `UPDATE users
         SET full_name = ?, username = ?, roll_number = ?, profile_image = ?
         WHERE id = ?`,
        [
          fullName,
          username,
          rollNumber,
          profileImage,
          req.session.userId,
        ]
      );

      if (req.file && currentUser.profile_image) {
        const oldName = path.basename(currentUser.profile_image);
        const newName = path.basename(profileImage);

        if (oldName !== newName) {
          deleteUploadedFile(path.join(uploadDir, oldName));
        }
      }

      const updatedUser = {
        id: currentUser.id,
        full_name: fullName,
        email: currentUser.email,
        username,
        roll_number: rollNumber,
        profile_image: profileImage || null,
      };

      res.json({
        success: true,
        message: "Profile updated successfully.",
        user: updatedUser,
      });
    } catch (error) {
      deleteUploadedFile(uploadedFile);
      console.error("Update profile error:", error.message);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "This username is already taken.",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update profile.",
      });
    }
  }
);

/* ================ LOGOUT ================ */

app.post("/api/auth/logout", (req, res) => {
  if (!req.session) {
    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  }

  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Logout failed.",
      });
    }

    res.clearCookie("findit.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      success: true,
      message: "Logged out successfully.",
    });
  });
});

/* ================ LOST ITEMS: GET ALL ================ */

app.get("/api/lost-items", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, user_id, item_name, category, description, location,
              date_lost, image_url, created_at
       FROM lost_items
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Fetch lost items error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch lost items.",
    });
  }
});

/* ================ LOST ITEMS: CREATE ================ */

app.post(
  "/api/lost-items",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    const uploadedFile = req.file?.path;

    try {
      const {
        item_name,
        category,
        description,
        location,
        date_lost,
        contact,
      } = req.body;

      if (
        !item_name?.trim() ||
        !category?.trim() ||
        !description?.trim() ||
        !location?.trim() ||
        !contact?.trim()
      ) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message:
            "Item name, category, description, location and contact are required.",
        });
      }

      if (!isValidDate(date_lost)) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Enter a valid lost date in YYYY-MM-DD format.",
        });
      }

      const imageUrl = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const [result] = await pool.execute(
        `INSERT INTO lost_items
          (user_id, item_name, category, description, location,
           date_lost, contact, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          item_name.trim(),
          category.trim(),
          description.trim(),
          location.trim(),
          date_lost,
          contact.trim(),
          imageUrl,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Lost item reported successfully.",
        id: result.insertId,
        image_url: imageUrl,
      });
    } catch (error) {
      deleteUploadedFile(uploadedFile);
      console.error("Create lost item error:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to save lost item.",
      });
    }
  }
);

/* ================ FOUND ITEMS: GET ALL ================ */

app.get("/api/found-items", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, user_id, item_name, category, description, location,
              date_found, image_url, created_at
       FROM found_items
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Fetch found items error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch found items.",
    });
  }
});

/* ================ AI ITEM MATCHING ================ */

app.get("/api/ai-matches/lost/:id", async (req, res) => {
  try {
    const lostItemId = Number(req.params.id);

    if (!Number.isInteger(lostItemId) || lostItemId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid lost item ID.",
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "OpenRouter API key is not configured.",
      });
    }

    const [lostRows] = await pool.execute(
      `SELECT id, item_name, category, description, location, date_lost
       FROM lost_items
       WHERE id = ?
       LIMIT 1`,
      [lostItemId]
    );

    if (lostRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lost item not found.",
      });
    }

    const lostItem = lostRows[0];

    const [foundItems] = await pool.execute(
      `SELECT id, item_name, category, description, location, date_found
       FROM found_items
       WHERE LOWER(TRIM(category)) = LOWER(TRIM(?))
         AND LOWER(status) = 'active'
       ORDER BY created_at DESC
       LIMIT 20`,
      [lostItem.category]
    );

    if (foundItems.length === 0) {
      return res.json({
        success: true,
        lostItem,
        matches: [],
        message: "No active found items in this category.",
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3.5-lightning:free",
          messages: [
            {
              role: "system",
              content: `You compare lost and found item descriptions.
Return only valid JSON in this format:
{
  "matches": [
    {
      "found_item_id": 1,
      "is_possible_match": true,
      "reason": "Short explanation"
    }
  ]
}
Compare item meaning, name, description and location.
Only include plausible matches.
Never claim certainty. Do not invent item IDs.
Use only the supplied found item IDs.`,
            },
            {
              role: "user",
              content: JSON.stringify({
                lost_item: lostItem,
                found_items: foundItems,
              }),
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", response.status, data);

      return res.status(502).json({
        success: false,
        message: "AI matching service failed.",
        providerStatus: response.status,
      });
    }

    const aiText = data.choices?.[0]?.message?.content;

    if (typeof aiText !== "string" || !aiText.trim()) {
      return res.status(502).json({
        success: false,
        message: "AI returned an empty response.",
      });
    }

    const cleanedText = aiText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let aiResult;

    try {
      aiResult = JSON.parse(cleanedText);
    } catch {
      console.error("Invalid AI JSON response:", aiText);

      return res.status(502).json({
        success: false,
        message: "AI returned an invalid response format.",
      });
    }

    const candidateById = new Map(
      foundItems.map((item) => [Number(item.id), item])
    );

    const seenIds = new Set();

    const matches = (Array.isArray(aiResult.matches)
      ? aiResult.matches
      : [])
      .filter((match) => {
        const id = Number(match.found_item_id);

        if (
          match.is_possible_match !== true ||
          !candidateById.has(id) ||
          seenIds.has(id)
        ) {
          return false;
        }

        seenIds.add(id);
        return true;
      })
      .map((match) => ({
        ...candidateById.get(Number(match.found_item_id)),
        reason:
          typeof match.reason === "string"
            ? match.reason.slice(0, 500)
            : "Potential match based on item details.",
      }));

    return res.json({
      success: true,
      lostItem,
      matches,
      message:
        matches.length > 0
          ? "Possible matches found."
          : "No possible matches found.",
    });
  } catch (error) {
    console.error("AI matching error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to find AI matches.",
    });
  }
});
/* ================ FOUND ITEMS: CREATE ================ */

app.post(
  "/api/found-items",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    const uploadedFile = req.file?.path;

    try {
      const {
        item_name,
        category,
        description,
        location,
        date_found,
        contact,
      } = req.body;

      if (
        !item_name?.trim() ||
        !category?.trim() ||
        !description?.trim() ||
        !location?.trim() ||
        !contact?.trim()
      ) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message:
            "Item name, category, description, location and contact are required.",
        });
      }

      if (!isValidDate(date_found)) {
        deleteUploadedFile(uploadedFile);

        return res.status(400).json({
          success: false,
          message: "Enter a valid found date in YYYY-MM-DD format.",
        });
      }

      const imageUrl = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const [result] = await pool.execute(
        `INSERT INTO found_items
          (user_id, item_name, category, description, location,
           date_found, contact, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          item_name.trim(),
          category.trim(),
          description.trim(),
          location.trim(),
          date_found,
          contact.trim(),
          imageUrl,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Found item reported successfully.",
        id: result.insertId,
        image_url: imageUrl,
      });
    } catch (error) {
      deleteUploadedFile(uploadedFile);
      console.error("Create found item error:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to save found item.",
      });
    }
  }
);

/* ================ CLAIMS: CREATE ================ */

app.post("/api/claims", requireAuth, async (req, res) => {
  try {
    const { lost_item_id, found_item_id, answers } = req.body ?? {};

    const lostId = Number(lost_item_id);
    const foundId = Number(found_item_id);

    if (
      !Number.isInteger(lostId) ||
      lostId <= 0 ||
      !Number.isInteger(foundId) ||
      foundId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid lost_item_id and found_item_id are required.",
      });
    }

    if (
      !Array.isArray(answers) ||
      answers.length !== 3 ||
      answers.some(
        (answer) =>
          !answer?.question ||
          !String(answer?.answer ?? "").trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please answer all three ownership questions.",
      });
    }

    const [lostRows] = await pool.execute(
      "SELECT id FROM lost_items WHERE id = ? LIMIT 1",
      [lostId]
    );

    const [foundRows] = await pool.execute(
      "SELECT id FROM found_items WHERE id = ? LIMIT 1",
      [foundId]
    );

    if (!lostRows.length || !foundRows.length) {
      return res.status(404).json({
        success: false,
        message: "The selected lost or found item does not exist.",
      });
    }

    const [existingClaims] = await pool.execute(
      `SELECT id FROM claims
       WHERE lost_item_id = ?
         AND found_item_id = ?
         AND LOWER(status) = 'pending'
       LIMIT 1`,
      [lostId, foundId]
    );

    if (existingClaims.length) {
      return res.status(409).json({
        success: false,
        message: "A pending claim already exists for this item pair.",
      });
    }

    const safeAnswers = answers.map((answer) => ({
      question: String(answer.question).trim(),
      answer: String(answer.answer).trim(),
    }));

    const reason = safeAnswers
      .map((answer) => `${answer.question}: ${answer.answer}`)
      .join("\n");

    const [result] = await pool.execute(
      `INSERT INTO claims
        (claimant_user_id, lost_item_id, found_item_id, answers, reason, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [
        req.session.userId,
        lostId,
        foundId,
        JSON.stringify(safeAnswers),
        reason,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Claim submitted successfully.",
      claim_id: result.insertId,
      status: "Pending",
    });
  } catch (error) {
    console.error("Create claim error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save claim. Check the claims table structure.",
    });
  }
});

/* ================ CLAIMS: GET RELATED CLAIMS ================ */

app.get("/api/claims", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
          c.id,
          c.claimant_user_id,
          c.lost_item_id,
          c.found_item_id,
          c.answers,
          c.reason,
          c.status,
          c.created_at,
          l.item_name AS lost_item_name,
          l.user_id AS lost_owner_id,
          f.item_name AS found_item_name,
          f.user_id AS found_owner_id,
          claimant.full_name AS claimant_name,
          found_owner.full_name AS found_owner_name
       FROM claims c
       JOIN lost_items l ON l.id = c.lost_item_id
       JOIN found_items f ON f.id = c.found_item_id
       LEFT JOIN users claimant ON claimant.id = c.claimant_user_id
       LEFT JOIN users found_owner ON found_owner.id = f.user_id
       WHERE c.claimant_user_id = ?
          OR l.user_id = ?
          OR f.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.session.userId, req.session.userId, req.session.userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Fetch claims error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch claims.",
    });
  }
});

/* ================ CLAIMS: APPROVE OR REJECT ================ */

app.patch(
  "/api/claims/:id/decision",
  requireAuth,
  async (req, res) => {
    let connection;

    try {
      const claimId = Number(req.params.id);
      const decision = String(req.body?.status || "").toLowerCase();

      if (!Number.isInteger(claimId) || claimId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid claim ID.",
        });
      }

      if (!["approved", "rejected"].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: "Status must be approved or rejected.",
        });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [initialRows] = await connection.execute(
        `SELECT c.id, c.status, c.found_item_id,
                f.user_id AS found_owner_id
         FROM claims c
         JOIN found_items f ON f.id = c.found_item_id
         WHERE c.id = ?
         LIMIT 1`,
        [claimId]
      );

      if (initialRows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Claim not found.",
        });
      }

      const initialClaim = initialRows[0];

      if (
        Number(initialClaim.found_owner_id) !==
        Number(req.session.userId)
      ) {
        await connection.rollback();

        return res.status(403).json({
          success: false,
          message: "Only the found-item reporter can review this claim.",
        });
      }

      const [foundRows] = await connection.execute(
        `SELECT id, status
         FROM found_items
         WHERE id = ?
         FOR UPDATE`,
        [initialClaim.found_item_id]
      );

      if (foundRows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Found item not found.",
        });
      }

      const foundItem = foundRows[0];

      const [claimRows] = await connection.execute(
        `SELECT id, status
         FROM claims
         WHERE id = ?
         FOR UPDATE`,
        [claimId]
      );

      if (
        claimRows.length === 0 ||
        String(claimRows[0].status).toLowerCase() !== "pending"
      ) {
        await connection.rollback();

        return res.status(409).json({
          success: false,
          message: "Only pending claims can be reviewed.",
        });
      }

      if (decision === "approved") {
        if (String(foundItem.status).toLowerCase() !== "active") {
          await connection.rollback();

          return res.status(409).json({
            success: false,
            message: "This item is no longer available for claiming.",
          });
        }

        await connection.execute(
          `UPDATE claims
           SET status = 'approved'
           WHERE id = ? AND LOWER(status) = 'pending'`,
          [claimId]
        );

        const [itemUpdate] = await connection.execute(
          `UPDATE found_items
           SET status = 'claimed'
           WHERE id = ? AND LOWER(status) = 'active'`,
          [initialClaim.found_item_id]
        );

        if (itemUpdate.affectedRows !== 1) {
          throw new Error("The item availability changed. Please retry.");
        }

        await connection.execute(
          `UPDATE claims
           SET status = 'rejected'
           WHERE found_item_id = ?
             AND id <> ?
             AND LOWER(status) = 'pending'`,
          [initialClaim.found_item_id, claimId]
        );
      } else {
        await connection.execute(
          `UPDATE claims
           SET status = 'rejected'
           WHERE id = ? AND LOWER(status) = 'pending'`,
          [claimId]
        );
      }

      await connection.commit();

      return res.json({
        success: true,
        message:
          decision === "approved"
            ? "Claim approved. Item marked as claimed; other pending claims rejected."
            : "Claim rejected. Item remains available.",
        claim_id: claimId,
        status: decision,
        item_status: decision === "approved" ? "claimed" : "active",
      });
    } catch (error) {
      if (connection) {
        await connection.rollback().catch(() => {});
      }

      console.error("Claim decision error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to update claim status.",
      });
    } finally {
      connection?.release();
    }
  }
);


/* ================ CLAIMS: MARK AS RETURNED ================ */

app.patch(
  "/api/claims/:id/returned",
  requireAuth,
  async (req, res) => {
    let connection;

    try {
      const claimId = Number(req.params.id);

      if (!Number.isInteger(claimId) || claimId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid claim ID.",
        });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        `SELECT c.id, c.status, c.found_item_id,
                f.user_id AS found_owner_id
         FROM claims c
         JOIN found_items f ON f.id = c.found_item_id
         WHERE c.id = ?
         FOR UPDATE`,
        [claimId]
      );

      if (rows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Claim not found.",
        });
      }

      const claim = rows[0];

      if (Number(claim.found_owner_id) !== Number(req.session.userId)) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: "Only the found-item owner can mark it as returned.",
        });
      }

      if (String(claim.status).toLowerCase() !== "approved") {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Only approved claims can be marked as returned.",
        });
      }

      await connection.execute(
        `UPDATE claims
         SET status = 'returned'
         WHERE id = ? AND LOWER(status) = 'approved'`,
        [claimId]
      );

      await connection.commit();

      return res.json({
        success: true,
        message: "Item marked as returned successfully.",
        claim_id: claimId,
        status: "returned",
      });
    } catch (error) {
      if (connection) {
        await connection.rollback().catch(() => {});
      }

      console.error("Mark returned error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not mark the item as returned.",
      });
    } finally {
      connection?.release();
    }
  }
);


/* ================ UNKNOWN API ROUTE ================ */

app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

/* ================ GLOBAL ERROR HANDLER ================ */

app.use((error, _req, res, _next) => {
  console.error("Request error:", error.message);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Image size must be 5 MB or less.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.status === 400) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

/* ================ START SERVER ================ */

app.listen(PORT, () => {
  console.log(
    `FindIt@Campus backend running at http://localhost:${PORT}`
  );
});
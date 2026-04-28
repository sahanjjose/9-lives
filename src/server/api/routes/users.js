const express = require("express");
const argon = require("argon2");
const crypto = require("crypto");
const router = express.Router({ mergeParams: true });
const db = require("../db/db_connection");
const orgdata = require("../db/orgs");
const {
  parseEmail,
  userExist,
  userOTP,
  userVerify,
  updateUsers
} = require("../db/users");

// Create new user (anyone can self-register)
router.post("/new", async (req, res) => {
  try {
    const { u_name, email, u_role, org_id, group_id, password } = req.body;
    if (!u_name || !email || !password) {
      return res.status(400).json({ error: "u_name, email and password are required" });
    }
    if (await userExist(email)) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashed = await argon.hash(password, { type: argon.argon2id });
    const role = u_role || "maintainer";
    const org  = org_id    || 1000001;
    const grp  = group_id  || 3000001;
    await db.query(
      `INSERT INTO users (u_name, email, u_role, org_id, group_id, hash_p)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [u_name, email, role, org, grp, hashed]
    );
    res.status(201).json({ u_name, email, u_role: role, org_id: org, group_id: grp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Login (returns minimal success)
router.post("/login", async (req, res) => {
  try {
    const { u_email, password } = req.body;
    if (!u_email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    if (!await userExist(u_email)) {
      return res.status(404).json({ error: "User does not exist" });
    }
    const valid = await userVerify(password, u_email, res);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Delete user (self-service)
router.delete("/delete", async (req, res) => {
  try {
    const { u_email, password } = req.body;
    if (!u_email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    if (!await userExist(u_email)) {
      return res.status(404).json({ error: "User does not exist" });
    }

    const org_id = await db.query("SELECT org_id FROM users WHERE email = ?", [u_email]);
    console.log("org_id", org_id);
    if (!await userVerify(password, u_email, res)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
   


    await db.query("DELETE FROM users WHERE email = ?", [u_email]);

    await orgdata.delete_org_empty(org_id.org_id);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all users (admin only)
router.get("/all", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user by email
router.get("/:email", async (req, res) => {
  try {
    const email = req.params.email;
    if (!await userExist(email)) {
      return res.status(404).json({ error: "User does not exist" });
    }
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Generate OTP
router.get("/:u_email/otp", async (req, res) => {
  try {
    const email = req.params.u_email;
    const otp = await userOTP(email, res);
    res.json({ otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update arbitrary user fields (self or admin)
// Expects { users_changes }: { [targetEmail]: { n_role?, n_org?, n_grp?, n_email?, n_pwd? } }
router.patch("/:u_email/update", async (req, res) => {
  const creds = req.params.u_email;
  const { users_changes } = req.body;
  return updateUsers(users_changes, creds, res);
});

// Assign a user to a group (admin only)
router.patch('/:email/group', async (req, res) => {
  const targetEmail = req.params.email;
  const { group_id, admin_email } = req.body;

  if (!group_id || !admin_email) {
    return res.status(400).json({ 
      error: 'Both group_id and admin_email are required' 
    });
  }

  try {
    // 1) make sure target exists
    const [[ targetUser ]] = await db.query(
      `SELECT u_id, org_id 
         FROM users 
        WHERE email = ?`,
      [ targetEmail ]
    );
    if (!targetUser) {
      return res
        .status(404)
        .json({ error: `User not found: ${targetEmail}` });
    }

    // 2) verify caller is an admin
    const [[ adminUser ]] = await db.query(
      `SELECT u_role, org_id 
         FROM users 
        WHERE email = ?`,
      [ admin_email ]
    );
    if (!adminUser || adminUser.u_role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Only admins can change group' });
    }

    // 3) enforce same‐org
    if (targetUser.org_id !== adminUser.org_id) {
      return res
        .status(403)
        .json({ error: 'Cannot assign groups across organizations' });
    }

    // 4) do the update (only group_id)
    await db.query(
      `UPDATE users 
          SET group_id = ? 
        WHERE email = ?`,
      [ group_id, targetEmail ]
    );

    // 5) return the updated user
    const [[ updatedUser ]] = await db.query(
      `SELECT u_id, u_name, email, u_role, org_id, group_id
         FROM users 
        WHERE email = ?`,
      [ targetEmail ]
    );

    return res.json({ success: true, user: updatedUser });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});


module.exports = router;

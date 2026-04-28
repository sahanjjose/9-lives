const db     = require("./db_connection");
const login  = require("../email/login");
const argon  = require("argon2");

//— Helpers —//

// Parse an email into a human name + domain
const parseEmail = async (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email format" };
  }
  const [handle, domain] = email.split("@");
  const name = handle.charAt(0).toUpperCase() + handle.slice(1).toLowerCase();
  return { name, destination: domain };
};

// Check existence
const userExist = async (email) => {
  const [rows] = await db.query(
    "SELECT 1 FROM users WHERE email = ?",
    [email]
  );
  return rows.length > 0;
};

// Send OTP
const userOTP = async (email, res) => {
  if (!await userExist(email)) {
    return res.status(404).json({ error: "User does not exist" });
  }
  const otp = await login.email(email);
  return otp;
};

// Verify password
const userVerify = async (password, email, res) => {
  const [rows] = await db.query(
    "SELECT hash_p FROM users WHERE email = ?",
    [email]
  );
  if (!rows.length) {
    return res.status(404).json({ error: "User not found" });
  }
  const hash = rows[0].hash_p;
  try {
    return await argon.verify(hash, password);
  } catch {
    return false;
  }
};

// Check admin role
const verifyAdmin = async (email) => {
  const [rows] = await db.query(
    "SELECT u_role FROM users WHERE email = ?",
    [email]
  );
  return rows.length && rows[0].u_role === "admin";
};

//— Bulk update (PATCH /users/:u_email/update) —//
// `changes` is an object keyed by target‐email, with sub‐fields
// If `credentials === target`, only `org_id` update is allowed.

const updateUsers = async (changes, credentials, res) => {
  const isAdmin = await verifyAdmin(credentials);
  const log = { in: [], out: [] };

  for (const targetEmail of Object.keys(changes)) {
    const { n_role, n_org, n_grp, n_email, n_pwd } = changes[targetEmail];
    log.in.push({ targetEmail, changes: { n_role, n_org, n_grp, n_email, n_pwd } });

    // Must exist
    if (!await userExist(targetEmail)) {
      log.out.push({ targetEmail, status: "Failed", message: "User not found" });
      continue;
    }

    // Self‐service path
    if (!isAdmin && credentials === targetEmail) {
      if (n_org) {
        try {
          await db.query("UPDATE users SET org_id = ? WHERE email = ?", [n_org, targetEmail]);
          log.out.push({ targetEmail, status: "Success", message: "Organization updated" });
        } catch (err) {
          log.out.push({ targetEmail, status: "Failed", message: err.message });
        }
      } else {
        log.out.push({ targetEmail, status: "Failed", message: "Not allowed" });
      }
      continue;
    }

    // Otherwise must be admin
    if (!isAdmin) {
      log.out.push({ targetEmail, status: "Failed", message: "Access denied" });
      continue;
    }

    // Admin updates
    try {
      if (n_role) {
        await db.query("UPDATE users SET u_role = ? WHERE email = ?", [n_role, targetEmail]);
        log.out.push({ targetEmail, status: "Success", message: "Role updated" });
      }
      if (n_org) {
        await db.query("UPDATE users SET org_id = ? WHERE email = ?", [n_org, targetEmail]);
        log.out.push({ targetEmail, status: "Success", message: "Organization updated" });
      }
      if (n_grp) {
        await db.query("UPDATE users SET group_id = ? WHERE email = ?", [n_grp, targetEmail]);
        log.out.push({ targetEmail, status: "Success", message: "Group updated" });
      }
      if (n_pwd) {
        const newHash = await argon.hash(n_pwd, { type: argon.argon2id });
        await db.query("UPDATE users SET hash_p = ? WHERE email = ?", [newHash, targetEmail]);
        log.out.push({ targetEmail, status: "Success", message: "Password updated" });
      }
      if (n_email) {
        // ensure new email not taken
        if (await userExist(n_email)) {
          log.out.push({ targetEmail, status: "Failed", message: "Email already in use" });
        } else {
          await db.query("UPDATE users SET email = ? WHERE email = ?", [n_email, targetEmail]);
          log.out.push({ targetEmail, status: "Success", message: "Email updated" });
        }
      }
    } catch (err) {
      log.out.push({ targetEmail, status: "Failed", message: err.message });
    }
  }

  res.status(200).json({ message: "Update complete", log });
};

module.exports = {
  parseEmail,
  userExist,
  userOTP,
  userVerify,
  verifyAdmin,
  updateUsers
};

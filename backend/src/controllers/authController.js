const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../config/database");
const { generateTokens, verifyRefreshToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");

async function register(req, res) {
  try {
    const { name, email, password, role = "user" } = req.body;
    const db = getDb();

    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return error(res, "Email already registered", 409);

    const assignedRole = role === "admin" && req.user?.role === "admin" ? "admin" : "user";
    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();

    await db.prepare(
      "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)"
    ).run(id, name.trim(), email, hashedPassword, assignedRole);

    const user = await db.prepare(
      "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?"
    ).get(id);

    const { accessToken, refreshToken } = generateTokens({ id: user.id, role: user.role });
    return success(res, { user, accessToken, refreshToken }, "Registration successful", 201);
  } catch (err) {
    console.error(err);
    return error(res, "Registration failed", 500);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const db = getDb();

    const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) return error(res, "Invalid credentials", 401);
    if (!user.is_active) return error(res, "Account deactivated", 403);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, "Invalid credentials", 401);

    const { accessToken, refreshToken } = generateTokens({ id: user.id, role: user.role });
    delete user.password;
    return success(res, { user, accessToken, refreshToken }, "Login successful");
  } catch (err) {
    console.error(err);
    return error(res, "Login failed", 500);
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, "Refresh token required", 400);

    const decoded = verifyRefreshToken(refreshToken);
    const db = getDb();
    const user = await db.prepare("SELECT id, role, is_active FROM users WHERE id = ?").get(decoded.id);

    if (!user || !user.is_active) return error(res, "User not found", 401);

    const tokens = generateTokens({ id: user.id, role: user.role });
    return success(res, tokens, "Tokens refreshed");
  } catch (err) {
    return error(res, "Invalid refresh token", 401);
  }
}

function getMe(req, res) {
  return success(res, { user: req.user }, "Profile fetched");
}

async function updateMe(req, res) {
  try {
    const { name, password } = req.body;
    const db = getDb();
    const updates = [];
    const params = [];

    if (name) { updates.push("name = ?"); params.push(name.trim()); }
    if (password) {
      const hashed = await bcrypt.hash(password, 12);
      updates.push("password = ?"); params.push(hashed);
    }
    if (!updates.length) return error(res, "Nothing to update", 400);

    updates.push("updated_at = datetime('now')");
    params.push(req.user.id);

    await db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    const updated = await db.prepare(
      "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?"
    ).get(req.user.id);
    return success(res, { user: updated }, "Profile updated");
  } catch (err) {
    return error(res, "Update failed", 500);
  }
}

module.exports = { register, login, refresh, getMe, updateMe };

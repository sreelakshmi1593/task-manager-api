const { getDb } = require("../config/database");
const { success, error, paginated } = require("../utils/response");

async function getUsers(req, res) {
  try {
    const db = getDb();
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const totalRow = await db.prepare("SELECT COUNT(*) as c FROM users").get();
    const users = await db.prepare(
      "SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).all(limit, offset);
    return paginated(res, users, totalRow.c, page, limit, "Users fetched");
  } catch (err) {
    return error(res, "Failed to fetch users", 500);
  }
}

async function getUser(req, res) {
  const db = getDb();
  const user = await db.prepare(
    "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?"
  ).get(req.params.id);
  if (!user) return error(res, "User not found", 404);
  return success(res, { user });
}

async function toggleUser(req, res) {
  const db = getDb();
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return error(res, "User not found", 404);
  if (user.id === req.user.id) return error(res, "Cannot deactivate your own account", 400);
  await db.prepare("UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?")
    .run(user.is_active ? 0 : 1, user.id);
  return success(res, {}, `User ${user.is_active ? "deactivated" : "activated"}`);
}

async function changeRole(req, res) {
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) return error(res, "Invalid role", 400);
  const db = getDb();
  const user = await db.prepare("SELECT id FROM users WHERE id = ?").get(req.params.id);
  if (!user) return error(res, "User not found", 404);
  await db.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").run(role, user.id);
  return success(res, {}, "Role updated");
}

async function deleteUser(req, res) {
  const db = getDb();
  const user = await db.prepare("SELECT id FROM users WHERE id = ?").get(req.params.id);
  if (!user) return error(res, "User not found", 404);
  if (user.id === req.user.id) return error(res, "Cannot delete your own account", 400);
  await db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
  return success(res, {}, "User deleted");
}

module.exports = { getUsers, getUser, toggleUser, changeRole, deleteUser };

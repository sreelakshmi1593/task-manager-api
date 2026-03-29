const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../config/database");
const { success, error, paginated } = require("../utils/response");

async function getAllTasks(req, res) {
  try {
    const db = getDb();
    const { page = 1, limit = 10, status, priority, search } = req.query;
    const offset = (page - 1) * limit;
    const isAdmin = req.user.role === "admin";

    const conditions = [];
    const params = [];

    if (!isAdmin) { conditions.push("user_id = ?"); params.push(req.user.id); }
    if (status)   { conditions.push("status = ?");  params.push(status); }
    if (priority) { conditions.push("priority = ?"); params.push(priority); }
    if (search)   {
      conditions.push("(title LIKE ? OR description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = await db.prepare(`SELECT COUNT(*) as count FROM tasks ${where}`).get(...params);
    const total = countRow ? countRow.count : 0;

    const tasks = await db.prepare(
      `SELECT t.*, u.name as user_name, u.email as user_email
       FROM tasks t LEFT JOIN users u ON t.user_id = u.id
       ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    return paginated(res, tasks, total, page, limit, "Tasks fetched");
  } catch (err) {
    console.error(err);
    return error(res, "Failed to fetch tasks", 500);
  }
}

async function getTask(req, res) {
  try {
    const db = getDb();
    const task = await db.prepare(
      "SELECT t.*, u.name as user_name FROM tasks t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = ?"
    ).get(req.params.id);

    if (!task) return error(res, "Task not found", 404);
    if (req.user.role !== "admin" && task.user_id !== req.user.id) {
      return error(res, "Access denied", 403);
    }
    return success(res, { task }, "Task fetched");
  } catch (err) {
    return error(res, "Failed to fetch task", 500);
  }
}

async function createTask(req, res) {
  try {
    const { title, description = "", status = "todo", priority = "medium", due_date = null } = req.body;
    const db = getDb();
    const id = uuidv4();

    await db.prepare(
      "INSERT INTO tasks (id, title, description, status, priority, due_date, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, title.trim(), description.trim(), status, priority, due_date, req.user.id);

    const task = await db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    return success(res, { task }, "Task created", 201);
  } catch (err) {
    console.error(err);
    return error(res, "Failed to create task", 500);
  }
}

async function updateTask(req, res) {
  try {
    const db = getDb();
    const task = await db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);

    if (!task) return error(res, "Task not found", 404);
    if (req.user.role !== "admin" && task.user_id !== req.user.id) {
      return error(res, "Access denied", 403);
    }

    const { title, description, status, priority, due_date } = req.body;
    const updates = [];
    const params = [];

    if (title !== undefined)       { updates.push("title = ?");       params.push(title.trim()); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description.trim()); }
    if (status !== undefined)      { updates.push("status = ?");      params.push(status); }
    if (priority !== undefined)    { updates.push("priority = ?");    params.push(priority); }
    if (due_date !== undefined)    { updates.push("due_date = ?");    params.push(due_date); }

    if (!updates.length) return error(res, "Nothing to update", 400);
    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);

    await db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    const updated = await db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    return success(res, { task: updated }, "Task updated");
  } catch (err) {
    return error(res, "Failed to update task", 500);
  }
}

async function deleteTask(req, res) {
  try {
    const db = getDb();
    const task = await db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);

    if (!task) return error(res, "Task not found", 404);
    if (req.user.role !== "admin" && task.user_id !== req.user.id) {
      return error(res, "Access denied", 403);
    }

    await db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    return success(res, {}, "Task deleted");
  } catch (err) {
    return error(res, "Failed to delete task", 500);
  }
}

async function getStats(req, res) {
  try {
    const db = getDb();
    const totalRow  = await db.prepare("SELECT COUNT(*) as c FROM tasks").get();
    const byStatus  = await db.prepare("SELECT status, COUNT(*) as count FROM tasks GROUP BY status").all();
    const byPriority = await db.prepare("SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority").all();
    const usersRow  = await db.prepare("SELECT COUNT(*) as c FROM users").get();

    return success(res, {
      total: totalRow.c,
      by_status: byStatus,
      by_priority: byPriority,
      total_users: usersRow.c,
    }, "Stats fetched");
  } catch (err) {
    return error(res, "Failed to fetch stats", 500);
  }
}

module.exports = { getAllTasks, getTask, createTask, updateTask, deleteTask, getStats };

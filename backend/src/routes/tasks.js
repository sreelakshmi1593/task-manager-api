const express = require("express");
const router = express.Router();
const { getAllTasks, getTask, createTask, updateTask, deleteTask, getStats } = require("../controllers/taskController");
const { authenticate, authorize } = require("../middleware/auth");
const {
  validate, taskCreateValidators, taskUpdateValidators, uuidParam, paginationQuery,
} = require("../middleware/validation");

/**
 * @swagger
 * /tasks/stats:
 *   get:
 *     summary: Get task statistics (Admin only)
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics
 *       403:
 *         description: Forbidden
 */
router.get("/stats", authenticate, authorize("admin"), getStats);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks (admin sees all, users see their own)
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated task list
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, paginationQuery, validate, getAllTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.get("/:id", authenticate, uuidParam, validate, getTask);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in_progress, done] }
 *               priority: { type: string, enum: [low, medium, high] }
 *               due_date: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Task created
 *       422:
 *         description: Validation error
 */
router.post("/", authenticate, taskCreateValidators, validate, createTask);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *               priority: { type: string }
 *               due_date: { type: string }
 *     responses:
 *       200:
 *         description: Task updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Not found
 */
router.put("/:id", authenticate, uuidParam, taskUpdateValidators, validate, updateTask);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Not found
 */
router.delete("/:id", authenticate, uuidParam, validate, deleteTask);

module.exports = router;

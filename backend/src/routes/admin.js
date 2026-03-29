const express = require("express");
const router = express.Router();
const { getUsers, getUser, toggleUser, changeRole, deleteUser } = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");
const { uuidParam, validate, paginationQuery } = require("../middleware/validation");

const adminOnly = [authenticate, authorize("admin")];

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User list
 *       403:
 *         description: Forbidden
 */
router.get("/users", ...adminOnly, paginationQuery, validate, getUsers);
router.get("/users/:id", ...adminOnly, uuidParam, validate, getUser);

/**
 * @swagger
 * /admin/users/{id}/toggle:
 *   patch:
 *     summary: Toggle user active status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch("/users/:id/toggle", ...adminOnly, uuidParam, validate, toggleUser);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Change user role (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch("/users/:id/role", ...adminOnly, uuidParam, validate, changeRole);
router.delete("/users/:id", ...adminOnly, uuidParam, validate, deleteUser);

module.exports = router;

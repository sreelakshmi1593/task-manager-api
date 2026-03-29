const { validationResult, body, param, query } = require("express-validator");
const { error } = require("../utils/response");

// Run validation and return 422 if errors found
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, "Validation failed", 422, errors.array());
  }
  next();
}

// Auth validators
const registerValidators = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 100 }),
  body("email").trim().isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
  body("role").optional().isIn(["user", "admin"]).withMessage("Role must be user or admin"),
];

const loginValidators = [
  body("email").trim().isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// Task validators
const taskCreateValidators = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("status").optional().isIn(["todo", "in_progress", "done"]),
  body("priority").optional().isIn(["low", "medium", "high"]),
  body("due_date").optional().isISO8601().withMessage("due_date must be a valid ISO date"),
];

const taskUpdateValidators = [
  body("title").optional().trim().notEmpty().isLength({ max: 200 }),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("status").optional().isIn(["todo", "in_progress", "done"]),
  body("priority").optional().isIn(["low", "medium", "high"]),
  body("due_date").optional().isISO8601().withMessage("due_date must be a valid ISO date"),
];

const uuidParam = [param("id").isUUID().withMessage("Invalid ID format")];

const paginationQuery = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(["todo", "in_progress", "done"]),
  query("priority").optional().isIn(["low", "medium", "high"]),
];

module.exports = {
  validate,
  registerValidators,
  loginValidators,
  taskCreateValidators,
  taskUpdateValidators,
  uuidParam,
  paginationQuery,
};

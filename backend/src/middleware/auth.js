const { verifyAccessToken } = require("../utils/jwt");
const { getDb } = require("../config/database");
const { error } = require("../utils/response");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, "Access token required", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const db = getDb();
    const user = await db.prepare("SELECT * FROM users WHERE id = ? AND is_active = 1").get(decoded.id);

    if (!user) return error(res, "User not found or deactivated", 401);

    delete user.password;
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return error(res, "Token expired", 401);
    if (err.name === "JsonWebTokenError") return error(res, "Invalid token", 401);
    return error(res, "Authentication failed", 401);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return error(res, "Not authenticated", 401);
    if (!roles.includes(req.user.role)) return error(res, "Insufficient permissions", 403);
    next();
  };
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);
      const db = getDb();
      const user = await db.prepare("SELECT * FROM users WHERE id = ? AND is_active = 1").get(decoded.id);
      if (user) { delete user.password; req.user = user; }
    }
  } catch (_) { /* swallowed */ }
  next();
}

module.exports = { authenticate, authorize, optionalAuth };

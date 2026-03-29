const { error } = require("../utils/response");

function notFound(req, res) {
  return error(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.stack || err.message}`);

  if (err.name === "SyntaxError" && err.status === 400) {
    return error(res, "Invalid JSON in request body", 400);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === "production" && statusCode === 500
    ? "Internal server error"
    : err.message || "Internal server error";

  return error(res, message, statusCode);
}

module.exports = { notFound, errorHandler };

const success = (res, data = {}, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const error = (res, message = "An error occurred", statusCode = 500, errors = []) =>
  res.status(statusCode).json({ success: false, message, ...(errors.length && { errors }) });

const paginated = (res, data, total, page, limit, message = "Success") =>
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  });

module.exports = { success, error, paginated };

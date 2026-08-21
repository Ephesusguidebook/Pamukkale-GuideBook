// Express 4 does not automatically catch a rejected promise thrown by an
// async route handler — an unhandled rejection would just hang the request.
// Wrap every async handler with this so a thrown/rejected error is forwarded
// to the app's error-handling middleware exactly like a sync throw would be.
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;

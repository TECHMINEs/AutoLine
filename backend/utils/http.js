/**
 * Logs the real failure server-side and returns a generic 500 to the client.
 * Raw database/driver messages must never reach the browser.
 */
function sendServerError(res, context, err) {
  console.error(`[${context}]`, err);
  res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
}

module.exports = { sendServerError };

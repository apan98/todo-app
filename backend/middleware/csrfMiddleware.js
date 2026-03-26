function csrfProtection(req, res, next) {
  // We don't need to check for a CSRF token on safe methods
  if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') {
    return next();
  }

  const csrfTokenFromHeader = req.headers['x-csrf-token'];
  const csrfTokenFromCookie = req.cookies['csrf-token'];

  if (!csrfTokenFromHeader || !csrfTokenFromCookie || csrfTokenFromHeader !== csrfTokenFromCookie) {
    console.warn('CSRF token validation failed. Header:', csrfTokenFromHeader, 'Cookie:', csrfTokenFromCookie);
    return res.status(403).json({ error: 'Forbidden: Invalid CSRF token' });
  }

  next();
}

module.exports = csrfProtection;

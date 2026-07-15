const SESSION_MAX_AGE = 15 * 60 * 1000;

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
  if (!roles.includes(req.session.user.role)) {
    return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
  }
  next();
};

module.exports = { requireAuth, requireRole, SESSION_MAX_AGE };

/**
 * @fileoverview Role-based access control middleware.
 * Factory function that returns middleware restricting access to specific roles.
 */

/**
 * Create a middleware that restricts access to the specified roles.
 * @param  {...string} allowedRoles - Roles permitted to access the route (e.g. 'admin')
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/admin-only', auth, roleGuard('admin'), controller);
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

export default roleGuard;

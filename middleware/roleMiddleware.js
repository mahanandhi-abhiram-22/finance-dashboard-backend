
// =======================
// middleware/roleMiddleware.js
// =======================

export const allowRoles = (...roles) => {
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

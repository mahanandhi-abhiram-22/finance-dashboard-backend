import jwt from "jsonwebtoken";
import { findUserById } from "../data/db.js";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, SECRET);
    const user = findUserById(payload.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = { id: user.id, email: user.email, role: user.role, status: user.status };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const generateToken = (user) => {
  const payload = { id: user.id, role: user.role };
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
};

export default authenticate;

import express from "express";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser, listUsers, updateUser, findUserById } from "../data/db.js";
import { generateToken, authenticate } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Public: login
router.post('/login',
  body('email').isEmail(),
  body('password').isString().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(403).json({ message: 'User inactive' });
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } });
  }
);

// Admin: create user
router.post('/',
  authenticate,
  allowRoles('admin'),
  body('name').isString().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role = 'viewer' } = req.body;
    if (findUserByEmail(email)) return res.status(409).json({ message: 'Email exists' });
    const hashed = bcrypt.hashSync(password, 8);
    const user = createUser({ name, email, password: hashed, role, status: 'active' });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
  }
);

// Admin: list users
router.get('/', authenticate, allowRoles('admin'), (req, res) => {
  res.json(listUsers());
});

// Admin: update user role/status
router.patch('/:id', authenticate, allowRoles('admin'), (req, res) => {
  const id = Number(req.params.id);
  const user = updateUser(id, req.body);
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
});

// Me
router.get('/me', authenticate, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
});

export default router;

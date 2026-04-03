
// =======================
// routes/transactionRoutes.js
// =======================

import express from "express";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { authenticate } from "../middleware/auth.js";
import { body, validationResult, query } from 'express-validator';
import { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction, getTransactionsCount } from "../data/db.js";

const router = express.Router();

// GET all transactions
router.get(
  "/",
  authenticate,
  query('type').optional().isIn(['income', 'expense']),
  query('category').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { type, category } = req.query;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const rows = getTransactions({ type, category, limit: pageSize, offset });
    const total = getTransactionsCount({ type, category });
    res.json({ meta: { page, pageSize, total }, data: rows });
  }
);

// CREATE transaction (Admin only)
router.post("/",
  authenticate,
  allowRoles("admin"),
  body('amount').isNumeric(),
  body('type').isIn(['income','expense']),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { amount, type, category, date, note } = req.body;
    const tx = createTransaction({ amount, type, category, date, note });
    res.status(201).json(tx);
  }
);

// UPDATE transaction
router.patch('/:id', authenticate, allowRoles('admin'), (req, res) => {
  const id = Number(req.params.id);
  const tx = updateTransaction(id, req.body);
  if (!tx) return res.status(404).json({ message: 'Not found' });
  res.json(tx);
});

// DELETE transaction
router.delete('/:id', authenticate, allowRoles('admin'), (req, res) => {
  const id = Number(req.params.id);
  const ok = deleteTransaction(id);
  if (!ok) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

export default router;

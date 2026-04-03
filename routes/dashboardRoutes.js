
// =======================
// routes/dashboardRoutes.js
// =======================

import express from "express";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { authenticate } from "../middleware/auth.js";
import { getSummary } from "../data/db.js";

const router = express.Router();

router.get('/summary', authenticate, allowRoles('analyst', 'admin'), (req, res) => {
  const summary = getSummary();
  res.json(summary);
});

export default router;

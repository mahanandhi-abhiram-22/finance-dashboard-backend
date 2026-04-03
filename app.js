import express from 'express';
import cors from 'cors';
import transactionRoutes from './routes/transactionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { findUserByEmail, createUser } from './data/db.js';
import bcrypt from 'bcryptjs';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Ensure a default admin exists (dev convenience)
if (!findUserByEmail('admin@local')) {
  const password = process.env.ADMIN_PWD || 'admin123';
  const hashed = bcrypt.hashSync(password, 8);
  createUser({ name: 'Admin', email: 'admin@local', password: hashed, role: 'admin', status: 'active' });
  console.log('Created default admin: admin@local (use ADMIN_PWD env to override)');
}

app.use((req, res, next) => { res.setHeader('X-Powered-By', 'finance-backend-demo'); next(); });

app.use('/transactions', transactionRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/users', userRoutes);
app.use(errorHandler);

export default app;

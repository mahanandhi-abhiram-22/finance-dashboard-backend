import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'finance.db');
const db = new Database(dbPath);

// Initialize tables
db.prepare(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL
  )`
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    date TEXT,
    note TEXT
  )`
).run();

// Indexes to speed up common queries
db.prepare("CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)").run();

// Users
export const findUserByEmail = (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email);
export const findUserById = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
export const createUser = (user) => {
  const stmt = db.prepare('INSERT INTO users (name,email,password,role,status) VALUES (?,?,?,?,?)');
  const info = stmt.run(user.name, user.email, user.password, user.role, user.status || 'active');
  return findUserById(info.lastInsertRowid);
};
export const listUsers = () => db.prepare('SELECT id,name,email,role,status FROM users').all();
export const updateUser = (id, data) => {
  const user = findUserById(id);
  if (!user) return null;
  const role = data.role || user.role;
  const status = data.status || user.status;
  db.prepare('UPDATE users SET role = ?, status = ? WHERE id = ?').run(role, status, id);
  return findUserById(id);
};

// Transactions
export const createTransaction = (tx) => {
  const stmt = db.prepare('INSERT INTO transactions (amount,type,category,date,note) VALUES (?,?,?,?,?)');
  const info = stmt.run(tx.amount, tx.type, tx.category || null, tx.date || null, tx.note || null);
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(info.lastInsertRowid);
};

export const getTransactions = ({ type, category, limit, offset } = {}) => {
  let q = 'SELECT * FROM transactions';
  const where = [];
  const params = [];
  if (type) { where.push('type = ?'); params.push(type); }
  if (category) { where.push('category = ?'); params.push(category); }
  if (where.length) q += ' WHERE ' + where.join(' AND ');
  q += ' ORDER BY id ASC';
  if (limit) q += ' LIMIT ' + Number(limit);
  if (offset) q += ' OFFSET ' + Number(offset);
  return db.prepare(q).all(...params);
};

export const getTransactionsCount = ({ type, category } = {}) => {
  let q = 'SELECT COUNT(*) as count FROM transactions';
  const where = [];
  const params = [];
  if (type) { where.push('type = ?'); params.push(type); }
  if (category) { where.push('category = ?'); params.push(category); }
  if (where.length) q += ' WHERE ' + where.join(' AND ');
  return db.prepare(q).get(...params).count;
};

export const getTransactionById = (id) => db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);

export const updateTransaction = (id, data) => {
  const tx = getTransactionById(id);
  if (!tx) return null;
  const amount = data.amount !== undefined ? data.amount : tx.amount;
  const type = data.type || tx.type;
  const category = data.category || tx.category;
  const date = data.date || tx.date;
  const note = data.note || tx.note;
  db.prepare('UPDATE transactions SET amount = ?, type = ?, category = ?, date = ?, note = ? WHERE id = ?')
    .run(amount, type, category, date, note, id);
  return getTransactionById(id);
};

export const deleteTransaction = (id) => {
  const info = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  return info.changes > 0;
};

export const getSummary = () => {
  const income = db.prepare("SELECT IFNULL(SUM(amount),0) as total FROM transactions WHERE type='income'").get().total;
  const expenses = db.prepare("SELECT IFNULL(SUM(amount),0) as total FROM transactions WHERE type='expense'").get().total;
  const balance = income - expenses;
  const recent = db.prepare('SELECT * FROM transactions ORDER BY id DESC LIMIT 5').all();
  const categories = db.prepare("SELECT category, IFNULL(SUM(amount),0) as total FROM transactions WHERE type='expense' GROUP BY category").all();
  const categoryTotals = {};
  categories.forEach(c => { categoryTotals[c.category] = c.total; });
  return { totalIncome: income, totalExpenses: expenses, balance, categoryTotals, recent };
};

export default db;

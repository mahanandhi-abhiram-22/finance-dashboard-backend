import request from 'supertest';
import app from '../app.js';

let token;

describe('Transactions API', () => {
  it('logs in default admin', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'admin@local', password: process.env.ADMIN_PWD || 'admin123' });
    expect(res.status).toBe(200);
    token = res.body.token;
    expect(token).toBeTruthy();
  });

  it('creates a transaction', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 123.45, type: 'expense', category: 'Test', date: '2026-04-03', note: 'test tx' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
  });

  it('lists transactions with pagination', async () => {
    const res = await request(app)
      .get('/transactions?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.meta).toBeTruthy();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns dashboard summary for analyst/admin', async () => {
    const res = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalIncome !== undefined).toBe(true);
  });
});

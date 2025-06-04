import { generateToken, authenticate } from '../src/middlewares/auth.middleware.js';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'vetSimSecretKey';

describe('auth middleware', () => {
  test('generateToken returns a valid JWT', () => {
    const payload = { id: '1', code: 'u1', role: 'user' };
    const token = generateToken(payload);
    const decoded = jwt.verify(token, secret);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.code).toBe(payload.code);
    expect(decoded.role).toBe(payload.role);
  });

  test('authenticate populates req.user when token is valid', () => {
    const payload = { id: '2', code: 'u2', role: 'admin' };
    const token = generateToken(payload);
    const req = { cookies: { token } };
    const res = { redirect: jest.fn() };
    const next = jest.fn();
    authenticate(req, res, next);
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalled();
  });
});

import config from '../../config/test.json';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import authMiddleware from '../../middleware/authMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(() => {
  process.env.JWT_SECRET = 'your_secret_key';
});

describe('authMiddleware', () => {
  const validToken = jwt.sign({ userId: 123 }, 'your_secret_key', { expiresIn: '1h' });
  const expiredToken = jwt.sign({ userId: 123 }, 'your_secret_key', { expiresIn: '-1s' });
  const invalidToken = 'invalid.token.string';

  test('should throw 401 if token is missing', () => {
    const req = { headers: {} };
    const res = {};
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, message: 'Token is required' }));
  });

  test('should return decoded payload for a valid token', () => {
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = {};
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(req.user).toHaveProperty('userId', 123);
    expect(next).toHaveBeenCalledTimes(1); 
    expect(next).toHaveBeenCalledWith(); 
  });

  test('should throw 401 if token is expired', () => {
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = {};
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, message: 'Token expired' }));
  });

  test('should throw 401 if token is invalid', () => {
    const req = { headers: { authorization: `Bearer ${invalidToken}` } };
    const res = {};
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, message: 'Invalid token' }));
  });

  test('should throw 401 for unexpected verification errors', () => {
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = {};
    const next = jest.fn();

    jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('Unknown error'); });

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, message: 'Token verification failed' }));

    jwt.verify.mockRestore(); 
  });
});

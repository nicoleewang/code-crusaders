import config from '../../config/test.json';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import authMiddleware from '../../middleware/authMiddleware.js';
import dotenv from 'dotenv';

const port = config.port;
const url = config.url;
dotenv.config();

beforeAll(() => {
  process.env.JWT_SECRET = 'your_secret_key';
});

describe('authMiddleware', () => {
  const validToken = jwt.sign({ userId: 123 }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const expiredToken = jwt.sign({ userId: 123 }, process.env.JWT_SECRET, { expiresIn: '-1s' });
  const invalidToken = 'invalid.token.string';

  test('should throw 401 if token is missing', () => {
    const req = { headers: {} };  // Token is missing in headers
    const res = {};
    const next = jest.fn();

    authMiddleware(req, res, next);

    // Check that it called next with the correct error
    expect(next).toHaveBeenCalledWith(createHttpError(401, 'Unauthorized: Token is required'));
  });

  test('should return decoded payload for a valid token', () => {
    const req = { headers: { authorization: `Bearer ${validToken}` } }; // valid token
    const res = {};
    const next = jest.fn();

    authMiddleware(req, res, next);

    // Check that it called next and attached the decoded user info to req.user
    expect(req.user).toHaveProperty('userId', 123);
    expect(next).toHaveBeenCalledWith(); // next should be called with no arguments
  });

  test('should throw 401 if token is expired', () => {
    const req = { headers: { authorization: `Bearer ${expiredToken}` } }; // expired token
    const res = {};
    const next = jest.fn();

    authMiddleware(req, res, next);

    // Check that it called next with the correct error
    expect(next).toHaveBeenCalledWith(createHttpError(401, 'Unauthorized: Token expired'));
  });

  test('should throw 401 if token is invalid', () => {
    const req = { headers: { authorization: `Bearer ${invalidToken}` } }; // invalid token
    const res = {};
    const next = jest.fn();

    authMiddleware(req, res, next);

    // Check that it called next with the correct error
    expect(next).toHaveBeenCalledWith(createHttpError(401, 'Unauthorized: Invalid token'));
  });

  test('should throw 401 for unexpected verification errors', () => {
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = {};
    const next = jest.fn();

    // Mock the jwt.verify method to throw an unexpected error
    jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('Unknown error'); });

    authMiddleware(req, res, next);

    // Check that it called next with the correct error
    expect(next).toHaveBeenCalledWith(createHttpError(401, 'Unauthorized: Token verification failed'));

    jwt.verify.mockRestore();
  });
});
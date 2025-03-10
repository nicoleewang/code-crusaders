import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';

// Middleware to verify the token and attach user info to the request
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  // token doesn't exist
  if (!token) {
    return next(createHttpError(401, 'Unauthorized: Token is required'));
  }

  try {
    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); 
  } catch (error) {
    // token errors
    if (error.name === 'TokenExpiredError') {
      return next(createHttpError(401, 'Unauthorized: Token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(createHttpError(401, 'Unauthorized: Invalid token'));
    } else {
      return next(createHttpError(401, 'Unauthorized: Token verification failed'));
    }
  }
};

export default authMiddleware;

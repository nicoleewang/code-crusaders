import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';

// Middleware to verify the token and attach user info to the request
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(createHttpError(401, 'Token is required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(createHttpError(401, 'Token expired'));

    } else if (error.name === 'JsonWebTokenError') {
      return next(createHttpError(401, 'Invalid token'));

    } else {
      return next(createHttpError(401, 'Token verification failed'));
      
    }
  }
};

export default authMiddleware;

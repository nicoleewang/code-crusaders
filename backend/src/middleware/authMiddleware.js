import jwt from 'jsonwebtoken';

/**
 * Middleware to verify the token and attach user info to the request.
 *
 * @param {object} req - The request object, contains the headers and other information related to the HTTP request
 * @param {object} res - The response object used to send back the response to the client
 * @param {function} next - A function to pass control to the next middleware or route handler in the stack.
 */
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else {
      return res.status(401).json({ error: 'Token verification failed' });
    }
  }
};

export default authMiddleware;

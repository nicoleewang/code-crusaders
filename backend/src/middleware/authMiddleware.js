// !!!! The following is just an example. You should implement proper token validation logic. !!!! //

import jwt from 'jsonwebtoken';

// Middleware to verify the token and attach user info to the request
const authMiddleware = (req, res, next) => {
    // const token = req.header('Authorization')?.split(' ')[1]; // Extract token from "Bearer <token>"

    // if (!token) {
    //     return res.status(401).json({ message: 'Access denied. No token provided.' });
    // }

    // try {
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    //     req.user = decoded; // Attach user info to request
    //     next(); // Proceed to the route handler
    // } catch (error) {
    //     res.status(401).json({ message: 'Invalid token' });
    // }
    next();
};

export default authMiddleware;

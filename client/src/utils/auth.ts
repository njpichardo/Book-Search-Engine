import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import type { Request, Response, NextFunction } from 'express';

dotenv.config();

interface JwtPayload {
  _id: unknown;
  username: string;
  email: string;
}

// Function for our authenticated routes (Express middleware)
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Allow token to be sent via req.body, req.query, or headers
  let token = req.body.token || req.query.token || req.headers.authorization;

  // ["Bearer", "<tokenvalue>"]
  if (req.headers.authorization) {
    token = token.split(' ').pop()?.trim();
  }

  if (!token) {
    return res.status(401).json({ message: 'You need to be logged in!' });
  }

  // Verify token and get user data out of it
  try {
    const secretKey = process.env.JWT_SECRET_KEY || '';
    const { _id, username } = jwt.verify(token, secretKey) as JwtPayload;
    
    // Add user data to request object
    req.user = { _id, username };
    next();
  } catch (err) {
    console.error('Invalid token');
    return res.status(401).json({ message: 'Invalid token!' });
  }
};

// Function for GraphQL authentication context
export const authMiddleware = ({ req }: { req: any }) => {
  // Allow token to be sent via req.body, req.query, or headers
  let token = req.body.token || req.query.token || req.headers.authorization;

  // ["Bearer", "<tokenvalue>"]
  if (req.headers.authorization) {
    token = token.split(' ').pop().trim();
  }

  if (!token) {
    return req;
  }

  // Verify token and get user data out of it
  try {
    const secretKey = process.env.JWT_SECRET_KEY || '';
    const { _id, username } = jwt.verify(token, secretKey) as JwtPayload;
    
    // Add user data to request object
    req.user = { _id, username };
  } catch (err) {
    console.error('Invalid token');
  }

  // Return updated request object
  return req;
};

export const signToken = (username: string, email: string, _id: unknown) => {
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY || '';

  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};
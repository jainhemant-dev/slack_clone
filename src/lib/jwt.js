import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

// If there's no JWT_SECRET in the environment variables, throw an error
if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable');
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object containing id and other user data
 * @param {String} expiresIn - Token expiration time (default: 7d)
 * @returns {String} JWT token
 */
export function generateToken(user, expiresIn = '7d') {
  const payload = {
    id: user._id.toString(),
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Get user data from a JWT token in a request (Next.js App Router version)
 * @param {Request} request - Next.js Request object
 * @returns {Object|null} User data or null if no valid token
 */
export async function getUserFromToken(request) {
  try {
    let token;
    
    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If no token in header, try to get from cookies
    if (!token) {
      const cookieStore = await cookies();
      token = await cookieStore.get('auth_token')?.value;
    }
    
    // If still no token, try to get from URL
    if (!token) {
      const url = new URL(request.url);
      token = url.searchParams.get('token');
    }
    
    if (!token) return null;
    
    // Verify the token and return user data
    return verifyToken(token);
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

import jwt from 'jsonwebtoken';

/**
 * ACCESS TOKEN (short life)
 */
export const generateAccessToken = (userId: number, role: string) => {
  return jwt.sign(
    {
      id: userId,
      role,
      type: 'access',
    },
    process.env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: '15m',
    }
  );
};

/**
 * REFRESH TOKEN (long life)
 */
export const generateRefreshToken = (userId: number) => {
  return jwt.sign(
    {
      id: userId,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: '7d',
    }
  );
};
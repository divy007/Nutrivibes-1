import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { IUser } from '@/models/User';
import { connectDB } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
    throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}

interface TokenPayload extends JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export const generateToken = (user: IUser): string => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            role: user.role,
        },
        JWT_SECRET,
        {
            expiresIn: '7d',
        }
    );
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
    } catch {
        return null;
    }
};

export const getAuthUser = async (request: Request): Promise<IUser | null> => {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return null;
        }

        const decoded = verifyToken(token);

        if (!decoded || !decoded.userId) {
            return null;
        }

        await connectDB();
        const user = await User.findById(decoded.userId).select('-password');

        return user;
    } catch {
        return null;
    }
};

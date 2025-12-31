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
    isProfileComplete?: boolean;
}

export const generateToken = (user: IUser, isProfileComplete?: boolean): string => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            role: user.role,
            isProfileComplete,
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
        // Try to get token from Authorization header first
        let token = request.headers.get('Authorization')?.replace('Bearer ', '');
        console.log('[getAuthUser] Token from header:', token);

        // If not in header, try to get from cookies
        if (!token || token === 'null' || token === 'undefined') {
            console.log('[getAuthUser] No valid header token, checking cookies');
            // Extract cookies from the request
            const cookieHeader = request.headers.get('cookie');
            if (cookieHeader) {
                const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                    const [key, value] = cookie.trim().split('=');
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>);

                // Check all possible token keys
                token = cookies['token_client'] || cookies['token_dietician'] || cookies['token'];
                console.log('[getAuthUser] Token from cookies:', token ? 'Found' : 'Not Found');
            }
        }

        if (!token || token === 'null' || token === 'undefined') {
            console.log('[getAuthUser] No token found in header or cookies');
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

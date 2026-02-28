import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
    if (cached!.conn) {

        return cached!.conn;
    }

    if (!cached!.promise) {
        console.log('[MONGODB] Starting new connection attempt...');
        const opts = {
            bufferCommands: false,
            dbName: 'diet_planner',
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            family: 4, // Force IPv4 to avoid timeout issues on some networks
        };

        cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            console.log('[MONGODB] Connection established successfully');
            return mongoose;
        }).catch(err => {
            console.error('[MONGODB] Connection promise failed:', err);
            throw err;
        });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (e) {
        cached!.promise = null;
        console.error('MongoDB connection error:', e);
        throw e;
    }

    return cached!.conn;
}

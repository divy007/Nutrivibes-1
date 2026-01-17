
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

async function deleteTestDb() {
    try {
        // Connect specifically to the 'test' database
        await mongoose.connect(MONGODB_URI as string, {
            dbName: 'test'
        });
        console.log('Connected to MongoDB (test DB)');
        console.log('Current Database:', mongoose.connection.name);

        if (mongoose.connection.name === 'test') {
            await mongoose.connection.db!.dropDatabase();
            console.log("Successfully dropped user 'test' database.");
        } else {
            console.log("Safeguard: Not connected to 'test' database. Aborting drop.");
        }

    } catch (error) {
        console.error('Error dropping database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

deleteTestDb();

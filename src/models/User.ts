import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email?: string;
    phone?: string;
    password?: string;
    role: 'DIETICIAN' | 'CLIENT';
    name: string;
    loginMethod: 'EMAIL_PASSWORD';
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        email: {
            type: String,
            required: false, // Email is now optional
            unique: true,
            lowercase: true,
            sparse: true, // Allows multiple null values
        },
        phone: {
            type: String,
            required: false,
            unique: true,
            sparse: true, // Allows multiple null values
        },
        password: {
            type: String,
            required: false, // Password optional for OTP users
            minlength: 6,
        },
        role: {
            type: String,
            enum: ['DIETICIAN', 'CLIENT'],
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        loginMethod: {
            type: String,
            enum: ['EMAIL_PASSWORD'],
            default: 'EMAIL_PASSWORD',
        },
    },
    {
        timestamps: true,
        toJSON: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transform: function (doc, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                delete ret.password;
            },
        },
    }
);

UserSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if the model already exists to prevent overwrite warning during hot reloading
const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

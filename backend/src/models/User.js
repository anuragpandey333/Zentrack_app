import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional, since googleId can be used instead
    googleId: { type: String },
    picture: { type: String }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

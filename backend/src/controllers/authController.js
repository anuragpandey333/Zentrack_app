import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../lib/prisma.js';
import { sendSecurityAlert } from '../services/emailService.js';

const client = new OAuth2Client();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword }
        });
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user.id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && user.password && (await bcrypt.compare(password, user.password))) {
            // Send security alert
            const loginTime = new Date().toLocaleString();
            await sendSecurityAlert(user, `New login detected on ${loginTime}`);
            
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ 
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, bio: true, hobbies: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    const { name, email, bio, hobbies } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { name, email, bio, hobbies },
            select: { id: true, name: true, email: true, bio: true, hobbies: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const googleAuth = async (req, res) => {
    const { credential, userInfo } = req.body;
    try {
        let email, name, picture, googleId;
        
        if (userInfo) {
            // OAuth2 flow with access token
            email = userInfo.email;
            name = userInfo.name;
            picture = userInfo.picture;
            googleId = userInfo.sub;
        } else {
            // ID token flow
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
            googleId = payload.sub;
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: { name, email, googleId, picture }
            });
        }
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            token: generateToken(user.id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

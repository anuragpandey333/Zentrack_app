import prisma from '../lib/prisma.js';

export const getUserProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                picture: true,
                bio: true,
                hobbies: true,
                currency: true,
                createdAt: true
            }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    const { name, picture, bio, hobbies, currency } = req.body;
    
    try {
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (picture !== undefined) updateData.picture = picture;
        if (bio !== undefined) updateData.bio = bio;
        if (hobbies !== undefined) updateData.hobbies = hobbies;
        if (currency !== undefined) updateData.currency = currency;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                picture: true,
                bio: true,
                hobbies: true,
                currency: true,
                createdAt: true
            }
        });
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

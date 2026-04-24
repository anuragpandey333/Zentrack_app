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
                notifySecurityAlerts: true,
                notifyMonthlyReports: true,
                notifyBudgetWarnings: true,
                notifyNewFeatures: true,
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
    const { name, picture, bio, hobbies, currency, notifySecurityAlerts, notifyMonthlyReports, notifyBudgetWarnings, notifyNewFeatures } = req.body;
    
    try {
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (picture !== undefined) updateData.picture = picture;
        if (bio !== undefined) updateData.bio = bio;
        if (hobbies !== undefined) updateData.hobbies = hobbies;
        if (currency !== undefined) updateData.currency = currency;
        if (notifySecurityAlerts !== undefined) updateData.notifySecurityAlerts = notifySecurityAlerts;
        if (notifyMonthlyReports !== undefined) updateData.notifyMonthlyReports = notifyMonthlyReports;
        if (notifyBudgetWarnings !== undefined) updateData.notifyBudgetWarnings = notifyBudgetWarnings;
        if (notifyNewFeatures !== undefined) updateData.notifyNewFeatures = notifyNewFeatures;

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
                notifySecurityAlerts: true,
                notifyMonthlyReports: true,
                notifyBudgetWarnings: true,
                notifyNewFeatures: true,
                createdAt: true
            }
        });
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

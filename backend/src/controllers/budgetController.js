import prisma from '../lib/prisma.js';

export const getBudget = async (req, res) => {
    try {
        const budget = await prisma.budget.findUnique({ where: { userId: req.user.id } });
        res.json(budget || { amount: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setBudget = async (req, res) => {
    const { amount } = req.body;
    try {
        const budget = await prisma.budget.upsert({
            where: { userId: req.user.id },
            update: { amount, month: new Date().toISOString().slice(0, 7) },
            create: { userId: req.user.id, amount, month: new Date().toISOString().slice(0, 7) }
        });
        res.json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

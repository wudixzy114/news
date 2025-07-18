import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import { prisma } from '../../server';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { createToken } from '../../core/utils/jwt';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(StatusCodes.CONFLICT).json({ error: { message: 'User with this email already exists.' } });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: { email, password: hashedPassword, name },
        select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = createToken({ userId: user.id });

    res.status(StatusCodes.CREATED).json({ user, token });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: { message: 'Invalid credentials.' } });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: { message: 'Invalid credentials.' } });
    }

    const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
    };

    const token = createToken({ userId: user.id });

    res.status(StatusCodes.OK).json({ user: userResponse, token });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    // req.user is attached by the 'protect' middleware
    const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: { message: 'User not found.' } });
    }

    res.status(StatusCodes.OK).json(user);
});
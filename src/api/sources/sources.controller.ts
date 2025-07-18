import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../server';
import { asyncHandler } from '../../core/utils/asyncHandler';

export const getAllSources = asyncHandler(async (req: Request, res: Response) => {
    const sources = await prisma.source.findMany();
    res.status(StatusCodes.OK).json(sources);
});
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../server';
import { asyncHandler } from '../../core/utils/asyncHandler';

export const getMySavedArticles = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const userId = req.user!.id;

    const articles = await prisma.article.findMany({
        where: { savedBy: { some: { id: userId } } },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: [{ createdAt: 'desc' }], // Order saved articles by when they were created in our DB
        include: { source: { select: { id: true, name: true } } },
    });

    const hasNextPage = articles.length > limit;
    const dataToSend = hasNextPage ? articles.slice(0, limit) : articles;
    const nextCursor = hasNextPage ? dataToSend[dataToSend.length - 1].id : null;

    // By definition, all these articles are saved by the user.
    const finalData = dataToSend.map(article => ({ ...article, isSaved: true }));

    res.status(StatusCodes.OK).json({
        data: finalData,
        hasNextPage,
        nextCursor,
    });
});
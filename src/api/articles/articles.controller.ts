import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../server';
import { asyncHandler } from '../../core/utils/asyncHandler';

export const getArticles = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const articles = await prisma.article.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: [
            { qualityScore: 'desc' },
            { publishedAt: 'desc' }, // Add publishedAt for better tie-breaking
            { id: 'desc' },
        ],
        include: {
            source: { select: { id: true, name: true } },
        },
    });

    const hasNextPage = articles.length > limit;
    const dataToSend = hasNextPage ? articles.slice(0, limit) : articles;
    const nextCursor = hasNextPage ? dataToSend[dataToSend.length - 1].id : null;

    let finalData: (typeof dataToSend[0] & { isSaved?: boolean })[] = dataToSend;

    if (req.user) {
        const savedArticles = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { savedArticles: { select: { id: true } } },
        });
        const savedArticleIds = new Set(savedArticles?.savedArticles.map(a => a.id));
        finalData = dataToSend.map(article => ({
            ...article,
            isSaved: savedArticleIds.has(article.id),
        }));
    }

    res.status(StatusCodes.OK).json({
        data: finalData,
        hasNextPage,
        nextCursor,
    });
});


export const getArticleById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const article = await prisma.article.findUnique({
        where: { id },
        include: { source: true },
    });

    if (!article) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: { message: 'Article not found.' } });
    }

    let finalArticle: typeof article & { isSaved?: boolean } = article;

    if (req.user) {
        const savedCount = await prisma.article.count({
            where: {
                id: article.id,
                savedBy: { some: { id: req.user.id } }
            }
        });
        finalArticle.isSaved = savedCount > 0;
    }

    res.status(StatusCodes.OK).json(finalArticle);
});

export const saveArticle = asyncHandler(async (req: Request, res: Response) => {
    const { id: articleId } = req.params;
    const userId = req.user!.id;

    await prisma.user.update({
        where: { id: userId },
        data: {
            savedArticles: {
                connect: { id: articleId }
            }
        }
    });

    res.status(StatusCodes.OK).json({ message: 'Article saved successfully.' });
});

export const unsaveArticle = asyncHandler(async (req: Request, res: Response) => {
    const { id: articleId } = req.params;
    const userId = req.user!.id;

    await prisma.user.update({
        where: { id: userId },
        data: {
            savedArticles: {
                disconnect: { id: articleId }
            }
        }
    });

    res.status(StatusCodes.OK).json({ message: 'Article unsaved successfully.' });
});
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const errorMiddleware = (
    error: Error & { statusCode?: number },
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.message || 'An unexpected error occurred.';

    console.error(`[Error] ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    console.error(error.stack);

    res.status(statusCode).json({
        error: {
            message,
            // 在开发环境中可以暴露堆栈信息
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
    });
};
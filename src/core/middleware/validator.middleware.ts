import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = errors.array().map(err => ({ [err.param]: err.msg }));

    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        errors: extractedErrors,
    });
};
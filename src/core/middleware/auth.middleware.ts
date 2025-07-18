import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyToken } from '../utils/jwt';

// 扩展 Express 的 Request 类型
declare global {
    namespace Express {
        interface Request {
            user?: { id: string };
        }
    }
}

// 强制认证中间件
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: { message: 'No token provided, authorization denied.' } });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: { message: 'Token is not valid.' } });
    }

    req.user = { id: decoded.userId };
    next();
});

// 可选认证中间件
export const optionalAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = verifyToken(token);
            if (decoded) {
                req.user = { id: decoded.userId };
            }
        } catch (error) {
            // 如果 token 无效，我们忽略它，继续作为匿名用户处理
        }
    }
    next();
});
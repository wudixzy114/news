import jwt from 'jsonwebtoken';
import { config } from '../config';

interface TokenPayload {
    userId: string;
}

export const createToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
        return null;
    }
};
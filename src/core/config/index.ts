import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL,
    jwt: {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES_IN!,
    },
    cors: {
        origin: process.env.CORS_ORIGIN!,
    },
};

if (!config.jwt.secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}
import app from './app';
import { config } from './core/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const startServer = async () => {
    try {
        // 测试数据库连接
        await prisma.$connect();
        console.log('Database connected successfully.');

        app.listen(config.port, () => {
            console.log(`Server is running on http://localhost:${config.port}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database', error);
        process.exit(1);
    }
};

startServer();
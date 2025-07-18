import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';

import { config } from './core/config';
import { errorMiddleware } from './core/middleware/error.middleware';
import apiRoutes from './api'; // 引入聚合的路由

const app: Application = express();

// --- 核心中间件 ---
app.use(helmet()); // 设置安全相关的 HTTP 头
app.use(cors({ origin: config.cors.origin })); // 允许特定源的跨域请求
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL-encoded 请求体

// --- API 路由 ---
app.use('/api', apiRoutes);

// --- 健康检查路由 ---
app.get('/', (req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({
        message: 'Welcome to News Aggregator API',
        version: '1.0.0',
    });
});

// --- 全局错误处理中间件 ---
app.use(errorMiddleware);

export default app;
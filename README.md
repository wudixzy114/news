# news

> **新闻聚合后端服务（news2-server）：Express + Prisma + PostgreSQL + JWT 鉴权，支持用户注册登录、收藏文章、RSS 源管理、按 qualityScore 排序分页。**

## 项目定位 / 背景

`news` 是一个**后端 API 服务**（`package.json: "news2-server" v1.0.0`），目标是为一个**新闻聚合前端**提供 RESTful 数据接口。它解决"如何用统一后端服务多个 RSS 源、对文章打分（qualityScore）、支持用户订阅/收藏"这类典型问题。

虽然仓库名是 `news`，但本目录**只包含后端代码**（无 frontend 子目录、无 README、无 .env.example）—— 推测前端在另一个仓库或后续接入。它的核心价值在于展示一个**生产级别的 Express + TypeScript 后端模板**，包含：

- **干净的目录分层**：`src/api/{articles,auth,sources,users}/` + `src/core/{config,middleware,utils}/`
- **完整的鉴权流**：JWT + bcryptjs + 双中间件（`protect` 强制 / `optionalAuth` 可选）
- **ORM-first 数据建模**：Prisma schema 三表（User / Article / Source）多对多收藏关系
- **游标分页 + 多字段排序**：`cursor/skip/take` + `orderBy: [{qualityScore:'desc'}, {publishedAt:'desc'}, {id:'desc'}]`
- **生产级中间件链**：helmet（安全头）+ cors（限定 origin）+ 全局 errorMiddleware
- **输入校验**：zod schema 验证（`validator.middleware.ts`）+ `http-status-codes` 统一状态码

## 仓库结构

```
news/
├── package.json                     # news2-server v1.0.0，type=commonjs
├── package-lock.json
├── tsconfig.json                    # target=es2016, module=commonjs
├── .gitignore
├── prisma/
│   └── schema.prisma                # User / Article / Source 三表 + 收藏关系
└── src/
    ├── server.ts                    # 入口：Prisma connect + app.listen
    ├── app.ts                       # Express app 装配：helmet + cors + json + /api 路由 + 错误处理
    ├── api/
    │   ├── index.ts                 # 聚合路由：/auth /articles /users /sources
    │   ├── auth/
    │   │   ├── auth.routes.ts       # POST /register, POST /login, GET /me
    │   │   ├── auth.controller.ts   # bcryptjs 哈希 + createToken
    │   │   └── auth.validator.ts    # 入参校验
    │   ├── articles/
    │   │   ├── articlces.routes.ts  # GET /, GET /:id, POST /:id/save, DELETE /:id/save
    │   │   └── articles.controller.ts # 游标分页 + qualityScore 排序 + isSaved 标记
    │   ├── users/
    │   │   ├── users.routes.ts
    │   │   └── users.controller.ts  # GET /me/saved
    │   └── sources/
    │       ├── sources.routes.ts
    │       └── sources.controller.ts # GET /（全部数据源）
    └── core/
        ├── config/index.ts          # dotenv 加载：PORT / DATABASE_URL / JWT_SECRET / CORS_ORIGIN
        ├── middleware/
        │   ├── auth.middleware.ts   # protect（强制）/ optionalAuth（可选）
        │   ├── error.middleware.ts  # 统一错误响应（含 dev 模式 stack）
        │   └── validator.middleware.ts # zod 校验
        └── utils/
            ├── asyncHandler.ts      # async/await 异常转发到 next
            └── jwt.ts               # createToken / verifyToken
```

## 技术栈

| 维度 | 选型 | 版本/说明 |
|------|------|-----------|
| 运行时 | Node.js | ≥ 18（@types/node ^24.0.14） |
| 语言 | TypeScript | ^5.8.3（target es2016, module commonjs） |
| Web 框架 | Express | ^5.1.0 |
| ORM | Prisma | ^6.12.0（@prisma/client 6.12.0） |
| 数据库 | PostgreSQL | `provider = "postgresql"` |
| 鉴权 | jsonwebtoken | ^9.0.2 |
| 密码哈希 | bcryptjs | （auth.controller.ts 中使用，`@types/bcryptjs` 未在 devDeps 列出，可能在 lockfile 隐式安装） |
| 安全中间件 | helmet | ^8.1.0 |
| 跨域 | cors | ^2.8.5 |
| 状态码 | http-status-codes | ^2.3.0 |
| 校验 | zod | ^4.0.5 |
| 配置 | dotenv | ^17.2.0 |
| 开发 | ts-node-dev | ^2.0.0（`--respawn --transpile-only`） |

## 核心模块 / 特性

### 1. 数据模型（`prisma/schema.prisma`）
三表 + 一个隐式多对多：
- `User { id, email@unique, password, name?, createdAt, updatedAt, savedArticles[] }`
- `Article { id, title, link@unique, summary?, content?, publishedAt, sourceId, category?, keywords[], qualityScore=0, createdAt, @@index(qualityScore) }`
- `Source { id, name, rssUrl@unique, articles[] }`
- 收藏关系：`User.savedArticles <-> Article.savedBy`（隐式 join table）

`Article.qualityScore` 加了 `@@index` 是热路径——首页分页 `orderBy qualityScore desc` 必走索引。

### 2. 鉴权流
- `auth.controller.register`：`bcrypt.hash(password, 12)` + `prisma.user.create` + `createToken({ userId })` → 201 + `{ user, token }`
- `auth.controller.login`：`prisma.user.findUnique` + `bcrypt.compare` + `createToken` → 200 + `{ user, token }`
- `auth.middleware.protect`：**强制**校验 `Authorization: Bearer <token>`，把 `req.user = { id }` 挂上
- `auth.middleware.optionalAuth`：token 无效也 `next()`，匿名用户继续走
- `jwt.sign` / `jwt.verify` 用 `JWT_SECRET` + `JWT_EXPIRES_IN`

### 3. 文章列表 + 游标分页
`articles.controller.getArticles`：
- `take: limit + 1` 探测下一页 + `cursor: { id }` + `skip: cursor ? 1 : 0`
- `orderBy: [{ qualityScore: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }]`（多级 tie-break）
- 如果 `req.user` 存在，额外查 `savedArticles`，给每条加 `isSaved: boolean`
- 返回 `{ data, hasNextPage, nextCursor }`

### 4. 收藏功能
- `POST /api/articles/:id/save` → `prisma.user.update({ data: { savedArticles: { connect: { id } } } })`
- `DELETE /api/articles/:id/save` → `disconnect`
- `GET /api/users/me/saved` 列出我的收藏（**全标 isSaved=true**）

### 5. 中间件链（`app.ts`）
```
helmet()        // 设置安全相关 HTTP 头
cors({origin})  // 限定 origin
express.json()  // 解析 JSON
/api/*          // 业务路由
/               // 健康检查 { message, version }
errorMiddleware // 统一 500 + dev 模式 stack 暴露
```

### 6. 错误处理
`errorMiddleware` 从 `error.statusCode` 读 HTTP 状态（默认 500），dev 模式返回 stack；`asyncHandler` 包装所有 async controller，把 reject 转发到 `next(err)`。

### 7. 配置（`core/config/index.ts`）
- `PORT`（默认 3000）
- `DATABASE_URL`
- `JWT_SECRET` / `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `JWT_SECRET` 缺失则启动时抛 `Error: JWT_SECRET is not defined in environment variables`

## 已完成 / 进行中

- ✅ Express + TypeScript + Prisma + PostgreSQL 全栈后端
- ✅ 4 个资源路由：auth / articles / sources / users
- ✅ JWT 鉴权 + bcryptjs 密码哈希
- ✅ Prisma schema + 收藏关系 + qualityScore 索引
- ✅ 游标分页 + 多级排序
- ✅ helmet + cors + 统一错误中间件
- ✅ zod 入参校验（auth.validator 已有占位）
- ✅ asyncHandler 包装
- ⏳ RSS 抓取 worker（`Source.rssUrl` 已建模但无抓取实现）
- ⏳ qualityScore 计算逻辑（已建模但未自动更新）
- ⏳ 单元测试 / 集成测试（package.json `"test": "echo ... && exit 1"`）
- ⏳ 前端项目（独立仓库）
- ⏳ .env.example / README（仓库内都没有）
- ⏳ Dockerfile / docker-compose
- ⏳ CI/CD

## 本地开发

```bash
# 装依赖
npm install

# 起 Postgres（用 docker 举例）
docker run -d --name news-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16

# 配 .env（仓库无 .env.example，请自建）
cat > .env <<'EOF'
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/news?schema=public
JWT_SECRET=change-me-in-prod
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
EOF

# 推 schema
npx prisma migrate dev --name init
# 或：npx prisma db push（开发期快速同步）

# 启动
npm run dev
# → http://localhost:3000
# 健康检查：curl http://localhost:3000/ → { message, version }
```

API 一览：

```
POST /api/auth/register   { email, password, name? } → { user, token }
POST /api/auth/login      { email, password }        → { user, token }
GET  /api/auth/me         (Bearer)                    → user

GET  /api/articles?limit=20&cursor=ID                 → { data, hasNextPage, nextCursor }
GET  /api/articles/:id                                → article (+isSaved if authed)
POST /api/articles/:id/save   (Bearer)                → 200
DELETE /api/articles/:id/save (Bearer)                → 200

GET  /api/users/me/saved                              → { data, hasNextPage, nextCursor }
GET  /api/sources                                      → [Source]
```

## 状态

**v1.0.0** —— 后端核心就绪：数据模型、鉴权、文章 CRUD、收藏、游标分页齐全。**RSS 抓取与打分逻辑未实现**，需后续 worker 接入。

## License

ISC（见 `package.json`）

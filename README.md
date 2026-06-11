# 达人视频数据抓取与产品帖筛选 MVP

本项目是一个本地可运行的 MVP Web 工具，用于验证以下链路：

1. 输入 Instagram / TikTok 红人主页链接或ID
2. 调用 Apify Actor 抓取视频数据
3. 过滤最近 N 天视频
4. 按产品关键词识别产品帖
5. 标记高潜帖子
6. 页面展示 + 导出 CSV/JSON

## 1. 安装依赖

```bash
npm install
```

## 2. 启动服务

```bash
npm start
```

启动后访问：

- http://localhost:3000

## 3. 如何填写 Apify Token

你有两种方式：

1. 前端页面直接输入 `Apify API Token`
2. 使用 `.env` 文件

示例：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
PORT=3000
APIFY_API_TOKEN=你的_apify_token
```

说明：

- 前端如果填写了 Token，优先使用前端输入
- 前端没填则尝试使用 `.env` 的 `APIFY_API_TOKEN`

## 4. 如何填写 Actor ID

在 Apify Actor 页面可找到 Actor 标识，常见格式：

- `用户名~actor名`
- `actor-id`

将其填入页面的 `Apify Actor ID` 输入框。

## 5. 如何测试

1. 打开 http://localhost:3000
2. 填写以下字段：
   - 平台（Instagram/TikTok）
   - 红人主页链接或ID
   - 产品关键词（逗号分隔）
   - Apify Token（或使用 `.env`）
   - Actor ID
   - 抓取天数（默认7）
   - 最大抓取数量（默认50）
3. 点击 `开始抓取`
4. 查看表格结果
5. 点击 `导出 CSV` 或 `导出 JSON`

### 本底数据调试模式（不调用 Apify）

为避免调试时反复产生 Apify 费用，页面支持 `使用本底数据调试模式（不调用 Apify，不产生费用）`：

1. 勾选该选项
2. 点击 `开始抓取`
3. 系统会读取本地样本：`data/mock/sample-items.json`

适合先验证以下链路：

- 字段清洗
- 产品帖识别
- 高潜识别
- 表格展示
- CSV / JSON 导出

### 健康检查接口

```bash
curl http://localhost:3000/api/health
```

## 6. 数据输出目录

- 原始数据：`/data/raw/`
- 清洗结果：`/data/output/`

每次抓取都会生成对应时间戳文件，方便排查。

## 7. 已实现的后端 API

1. `POST /api/scrape-influencer`
   - 调用 Apify Actor
   - 拉取 dataset items
   - 保存 raw JSON
   - 清洗字段、时间过滤、产品帖识别、高潜识别
   - 返回结果给前端

2. `POST /api/analyze-post`
   - 预留接口（v1 占位）

3. `GET /api/health`
   - 服务健康检查

4. `POST /api/workflow/fetch-post-details`
   - 工作流模块：对“已登记帖子”抓取详情
   - 入参 `targets` 支持帖子链接或用户名数组

5. `POST /api/workflow/run-once`
   - 工作流模块：一键执行
   - 抓取账号 -> 关键词命中 -> 对命中帖子抓取详情

### 工作流调用示例

```bash
curl -X POST http://localhost:3000/api/workflow/fetch-post-details \
  -H "Content-Type: application/json" \
  -d '{
    "apiToken":"YOUR_APIFY_TOKEN",
    "actorId":"xMc5Ga1oCONPmWJIa",
    "targets":[
      "https://www.instagram.com/p/DX0H1bvPLij/",
      "https://www.instagram.com/p/DXxGUKpvG3e/"
    ],
    "maxItems":20
  }'
```

```bash
curl -X POST http://localhost:3000/api/workflow/run-once \
  -H "Content-Type: application/json" \
  -d '{
    "platform":"instagram",
    "influencerInput":"natgeo",
    "productKeywords":"yozma,discount,code",
    "apiToken":"YOUR_APIFY_TOKEN",
    "actorId":"xMc5Ga1oCONPmWJIa",
    "detailActorId":"xMc5Ga1oCONPmWJIa",
    "days":14,
    "maxItems":50
  }'
```

## 8. 常见错误排查

1. `Apify Token 不能为空`
   - 前端输入 Token，或在 `.env` 配置 `APIFY_API_TOKEN`

2. `Actor ID 不能为空`
   - 检查 Actor ID 输入

3. `红人链接或ID 不能为空`
   - 检查输入框是否为空

4. `Apify actor run failed`
   - Token 无效 / Actor 不存在 / Actor 输入参数不匹配
   - 在 Apify 控制台先手动运行同一 Actor 验证输入

5. `Apify 返回为空`
   - 账号近7天无内容
   - Actor 输入未命中目标账号
   - 提高 `最大抓取数量` 或调整链接格式

6. 时间过滤后结果为0
   - 数据中时间字段可能缺失或格式异常
   - 返回结果中的 `invalidTimeCount` 会显示异常时间数量

## 9. 注意事项

- 当前是本地 MVP，不包含登录、数据库、钉钉集成
- 代码未写死 Token 和达人账号
- 所有关键参数通过前端输入或 `.env` 获取

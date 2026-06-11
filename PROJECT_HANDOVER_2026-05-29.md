# 红人数据检测项目移交文档（2026-05-29）

## 1. 项目目标（当前范围）

本项目当前目标是：本地运行一个工作台，驱动 Apify 抓取多平台红人内容，并写入钉钉多维表，用于后续仪表盘统计与运营分析。

已覆盖平台：

- `instagramreels`
- `youtubevideo`
- `youtubeshort`（统一口径，兼容旧值 `youtubeshot`）
- `tiktok`

核心链路：

1. 读取钉钉红人表（按“是否监控=是”筛选）
2. 平台自动路由对应 Actor 抓取
3. 关键词命中判定产品帖
4. 回填红人表 `url/url2/url3` 与状态
5. 写入视频表（去重更新）
6. 写入快照表（用于周/月增量统计）
7. 归档原始与清洗数据到本地文件

---

## 2. 代码结构

项目根目录：`/Users/ray/Desktop/ai项目/红人数据检测`

关键文件：

- `server.js`：后端（Express + Apify + DingTalk + 工作流）
- `public/index.html`：钉钉工作流控制台页面
- `public/app.js`：控制台前端逻辑
- `.env`：本地实际配置
- `.env.example`：配置模板
- `data/raw`：原始抓取归档
- `data/output`：清洗/摘要归档

---

## 3. 当前运行方式

```bash
cd /Users/ray/Desktop/ai项目/红人数据检测
npm start
```

服务地址：

- `http://127.0.0.1:3000`（同 `http://localhost:3000`）

---

## 4. 环境变量（钉钉版）

`.env` 中使用的字段：

- `PORT`
- `APIFY_API_TOKEN`
- `DINGTALK_APP_KEY`
- `DINGTALK_APP_SECRET`
- `DINGTALK_OPERATOR_ID`（可填 `userid`，后端会自动转换 unionId）
- `DINGTALK_DOC_ID`（baseId）
- `DINGTALK_INFLUENCER_TABLE_ID`（红人表）
- `DINGTALK_VIDEO_TABLE_ID`（视频表）
- `DINGTALK_SNAPSHOT_TABLE_ID`（快照表，可选）

重要：

- 真实密钥已在历史调试中暴露过，建议交接前统一轮换 `APIFY_API_TOKEN` 与钉钉密钥。

---

## 4.1 如何连接钉钉文件（实操步骤）

1. 在钉钉开放平台创建企业内部应用，获取：
- `AppKey`
- `AppSecret`

2. 在应用权限中开通至少以下能力：
- 多维表读写相关权限（notable/bases/sheets/records）
- `qyapi_get_member`（用于 `userid -> unionId` 转换）

3. 从钉钉多维表链接中提取 ID：
- 链接示例：`.../nodes/{baseId}?iframeQuery=...sheetId={sheetId}...`
- `baseId` -> 填 `DINGTALK_DOC_ID`
- `sheetId` -> 分别填
  - `DINGTALK_INFLUENCER_TABLE_ID`
  - `DINGTALK_VIDEO_TABLE_ID`
  - `DINGTALK_SNAPSHOT_TABLE_ID`

4. `DINGTALK_OPERATOR_ID` 填法：
- 可直接填 `userid`（例如 `17731939211035587`）
- 后端会自动调用 `topapi/v2/user/get` 转成 `unionId` 后再发起多维表请求

5. 把以上值写入 `.env`，重启服务：

```bash
cd /Users/ray/Desktop/ai项目/红人数据检测
npm start
```

6. 打开 `http://localhost:3000`，点击“执行钉钉同步”做小样本验证（`limitInfluencers=1`）。

---

## 4.2 权限问题处理 SOP（按报错码）

### A. `paramError-operatorId` / `MissingoperatorId`

根因：
- 传了错误 operatorId（常见是把 `unionId`/`userid`混用）

处理：
1. `.env` 的 `DINGTALK_OPERATOR_ID` 填企业内真实 `userid`
2. 确认 `qyapi_get_member` 已开通（否则无法转换 unionId）
3. 重启服务后重试

### B. `The user could not be found`（errcode=60121）

根因：
- 当前 `userid` 不属于该企业通讯录或写错

处理：
1. 在钉钉后台确认员工 `userid`
2. 替换 `.env` 后重启

### C. `Invalid method`（errcode=22）

根因：
- 调用了错误网关（历史上常见调用 `topapi/notable/*`）

处理：
- 必须使用 `api.dingtalk.com/v1.0/notable/bases/...` 路由

### D. `maxResults must between 1-100`

根因：
- 分页参数超过上限

处理：
- 代码中已限制 1..100；若二开请保持该限制

### E. `Specified api is not found`（更新时）

根因：
- 使用了错误更新方式（如 PATCH /records/{id}）

处理：
- 用 `PUT /records?operatorId=...` + body `records:[{id,fields}]`

### F. 前端只显示 `fetch failed`

根因：
- 网络错误被前端聚合

处理：
1. 重启到最新后端（已补详细错误）
2. 直接调用后端接口查看返回 JSON：

```bash
curl -s -X POST http://127.0.0.1:3000/api/workflow/sync-dingtalk \
  -H 'Content-Type: application/json' \
  -d '{"days":45,"maxItems":27,"limitInfluencers":1,"platformFilter":"all"}'
```

---

## 5. 后端接口清单（当前）

### 基础接口

- `GET /api/health`
- `GET /api/workflow/config`（读取 `.env` 自动填前端）
- `POST /api/analyze-post`（占位）
- `POST /api/scrape-influencer`（单次抓取与清洗）
- `POST /api/workflow/fetch-post-details`（单条详情抓取）
- `POST /api/workflow/run-once`（旧工作流，保留）

### 主工作流接口

- `POST /api/workflow/sync-dingtalk`

说明：

- `sync-feishu` 仍在代码里保留为历史逻辑，不建议继续使用。
- 前端控制台已切到 `sync-dingtalk`。

---

## 6. 平台路由与 Actor 映射

后端自动路由：

- `instagramreels` -> `xMc5Ga1oCONPmWJIa`
- `youtubevideo` -> `h7sDV53CddomktSi5`
- `youtubeshort` -> `WT1BVWatl2aHVeFEH`
- `tiktok` -> `GdWCkxBtKWOsKjdch`

口径统一：

- 内部统一用 `youtubeshort`
- 输入兼容 `youtubeshot / youtubeshorts / ytshort...`

---

## 7. 钉钉 API（已确认可用）

使用路由：

- 读字段：`GET /v1.0/notable/bases/{baseId}/sheets/{sheetId}/fields?operatorId={unionId}`
- 读记录：`GET /v1.0/notable/bases/{baseId}/sheets/{sheetId}/records?operatorId={unionId}`
- 新增记录：`POST /v1.0/notable/bases/{baseId}/sheets/{sheetId}/records?operatorId={unionId}`
- 更新记录：`PUT /v1.0/notable/bases/{baseId}/sheets/{sheetId}/records?operatorId={unionId}` + body `records:[{id,fields}]`

注意：

- `operatorId` 必须是 `unionId`；当前代码支持输入 `userid` 自动转换。

---

## 8. 数据表结构与映射

### 8.1 红人表（`hERWDMS`）

关键字段（已识别）：

- `红人名称`（text）
- `平台`（singleSelect）
- `是否监控`（singleSelect）
- `红人链接`（url）
- `样品型号`（text）
- `红人粉丝数据`（number）
- `是否出视频`（singleSelect）
- `url / url2 / url3`（url）

回填逻辑：

- `是否监控=否` 的行被跳过
- 命中内容后优先填 `url -> url2 -> url3` 空槽
- `是否出视频` 按本轮命中布尔写入
- `红人粉丝数据` 取该红人本轮抓取结果中的最大可用粉丝数

### 8.2 视频表（`Lxu42qk`）

关键字段：

- `红人名称`
- `平台`（singleSelect）
- `是否监控`（singleSelect）
- `id`
- `timestamp`（可 text 或 date；当前代码已兼容）
- `url`（url 类型）
- `caption`
- `commentsCount / likesCount / videoViewCount / videoPlayCount`（number）
- `videoUrl`
- `displayUrl`

写入逻辑：

- 去重优先键：`platform + postId`
- 兜底键：规范化 `url`
- 命中已存在 -> 更新
- 不存在 -> 新增

### 8.3 快照表（`dIHFmyP`）

关键字段：

- `runId`
- `capturedAt`（date）
- `platform`（singleSelect）
- `红人名称`
- `postKey`
- `postId`
- `postUrl`（url）
- `isProductPost`（singleSelect）
- `是否监控`（singleSelect）
- `videoPlayCount / videoViewCount / likesCount / commentsCount / sharesCount`
- `playDelta / viewDelta / likeDelta / commentDelta / shareDelta`
- **新增字段（后加）：**
  - `isFirstSeen`
  - `snapshotType`（`new`/`existing`）
  - `firstSeenAt`

写入逻辑：

- 每条命中都写快照（明细型时间序列）
- `delta = 当前值 - 同 postKey 上一次快照值`
- 首次出现：`isFirstSeen=是`, `snapshotType=new`
- 后续出现：`isFirstSeen=否`, `snapshotType=existing`

---

## 9. 产品帖判断逻辑

命中来源：

- `caption`
- `hashtags`
- `transcript`
- `latestComments`

规则：

- 任一关键词命中即 `isProductPost=true`
- 同时输出 `matchReason`、`confidenceScore`

---

## 10. 成本控制策略（已做）

- Instagram 不再二次调用单条详情 Actor（直接用首轮抓取结果）
- TikTok/YouTube 默认关闭昂贵下载与字幕能力（仅抓必要字段）
- 支持 `limitInfluencers` 小样本测试

---

## 11. 本地归档（已做）

在 `sync-dingtalk` 中，每个红人每轮都归档：

- `data/raw/{workflowTag}_{idx}_{platform}_{name}_raw.json`
- `data/output/{workflowTag}_{idx}_{platform}_{name}_cleaned.json`
- `data/output/{workflowTag}_{idx}_{platform}_{name}_summary.json`

作用：

- 可追溯抓取返回、清洗结果、写表摘要

---

## 12. 已发生问题清单（根因 + 处理）

### 12.1 Actor 未找到（404）

- 现象：`record-not-found / Actor not found`
- 根因：Actor ID 格式错误（混用 owner~id、短id、slug）
- 处理：统一按固定 actorId 路由

### 12.2 输入字段不匹配（400）

- 现象：`Field input.username is required / must be array`
- 根因：Instagram actor 需要 `username: []` 数组
- 处理：统一构造 `username` 数组输入

### 12.3 Apify 返回为空

- 根因：时间过滤 + 账号近期无内容 + 字段名不一致
- 处理：加入兼容时间字段与清晰错误提示

### 12.4 Feishu 写入字段失败（历史）

- 现象：`FieldNameNotFound` / `TextFieldConvFail`
- 根因：字段名与字段类型不匹配
- 处理：历史阶段已修；后续已迁移 DingTalk

### 12.5 钉钉 operatorId 报错

- 现象：`paramError-operatorId` / `MissingoperatorId`
- 根因：传了 `userid`，接口要求 `unionId`
- 处理：后端自动调用 `topapi/v2/user/get` 做 `userid -> unionId` 转换

### 12.6 钉钉 list records 上限报错

- 现象：`maxResults must between 1-100`
- 根因：分页参数超限
- 处理：clamp 到 `1..100`

### 12.7 钉钉更新接口 not found

- 现象：`Specified api is not found`
- 根因：更新方式错误（曾用 PATCH /records/{id}）
- 处理：改为 `PUT /records` 批量更新格式

### 12.8 视频表重复登记

- 根因：仅按 URL 去重，URL 形态差异导致重复
- 处理：改为 `platform+postId` 优先去重，URL 仅兜底且先规范化

### 12.9 `fetch failed` 无法定位

- 根因：异常被吞，只有通用报错
- 处理：为 Apify/DingTalk 网络请求补充 URL 级别错误信息

### 12.10 Node fetch 到 Apify 失败（curl 正常）

- 根因：Node 网络栈 DNS/IPv6 场景问题
- 处理：`dns.setDefaultResultOrder('ipv4first')`
- 状态：已改，需重启后验证

### 12.11 快照指标混在一起

- 根因：缺少“首次抓取 vs 存量”分层字段
- 处理：新增并写入 `isFirstSeen/snapshotType/firstSeenAt`

### 12.12 Instagram 粉丝数缺失

- 根因：当前 Instagram actor 原始返回无 follower 字段
- 处理：代码已兼容读取；但源数据没有则无法回填

### 12.13 YouTube Short 粉丝数遗漏

- 根因：字段是 `numberOfSubscribers`，早期未映射
- 处理：已补映射

### 12.14 页面刷新导致日志丢失

- 根因：前端日志在内存
- 处理：未做持久化；但后端继续执行不受影响

### 12.15 旧进程未重启导致“修复未生效”

- 现象：代码已改，但页面仍报旧错误
- 根因：3000 端口仍为旧 Node 进程
- 处理：`lsof -ti:3000 | xargs kill -9` 后重启

### 12.16 钉钉 URL 字段写入失败

- 现象：`the value 'https://...' is invalid for field url`
- 根因：钉钉 `url` 字段需要对象，不是纯字符串
- 处理：写入 `{ text, link }`

### 12.17 钉钉单选字段写入格式反复试错

- 现象：`[object Object] is invalid for field '是否监控'`
- 根因：单选字段写入对象格式不匹配
- 处理：改成直接传选项文本（如 `是/否`、`tiktok`）

### 12.18 快照表新增字段接口参数误用

- 现象：`Missingname`
- 根因：新增字段 body 外层包了一层 `field`
- 处理：改为字段对象直接作为请求体

### 12.19 前端显示“fetch failed”但无后端上下文

- 根因：前端只显示 `Error.message`，后端网络错误细节缺失
- 处理：后端补充 Apify/DingTalk 请求级错误文本（含 URL）

### 12.20 YouTube short 平台值不一致

- 现象：`youtubeshot`/`youtubeshort` 混用，路由/统计不一致
- 处理：统一内部值 `youtubeshort`，保留兼容映射

### 12.21 “只抓近 N 天”口径与 Actor 自带过滤不一致

- 现象：Actor 后台有 older 数据，本地结果数量对不上
- 根因：平台返回+本地二次过滤叠加、时间字段差异
- 处理：统一本地 `publishTime` 兼容字段并在日志输出 `raw/filtered`

### 12.22 视频表导出按钮无数据

- 现象：抓取完成但前端列表为空，导出不可用
- 根因：近 N 天过滤后 `filteredCount=0`
- 处理：增加完成提示显示 `rawCount/filteredCount/invalidTimeCount`

### 12.23 “matched=12 但只看到 3 条 URL”

- 根因：红人表只设计了 `url/url2/url3` 三个槽位
- 处理：其余命中写视频表；日志增加 `videoWrite created/updated/skipped`

### 12.24 重复触发导致 Apify 成本增加

- 根因：失败重试与接口不稳定期多次手动触发
- 处理：先 `limitInfluencers=1` 小样本验证后再放量

---

## 13. 当前仍需重点验证项（交接后第一优先）

1. **重启后验证 `fetch failed` 是否已被 `ipv4first` 解决**
   - 若仍失败，检查企业网络代理/防火墙/证书
2. **完整跑 4 平台一次，确认写表与归档完整**
3. **快照新增字段是否按预期写入**
   - `snapshotType` 是否正确区分 `new/existing`
4. **仪表盘口径是否拆分**
   - 发布口径（视频表 `timestamp`）
   - 增长口径（快照表 `capturedAt` + delta）

---

## 14. 建议的仪表盘口径（给同事）

必须分两套：

1. 发布表现（视频表，按 `timestamp`）
- 月新增素材数（去重 postKey）
- 月总曝光（sum(videoPlayCount)）
- 月总互动（sum(likes+comments+shares)）

2. 增长表现（快照表，按 `capturedAt`）
- 周/月曝光增量（sum(playDelta)）
- 周/月互动增量（sum(likeDelta+commentDelta+shareDelta)）
- 新旧拆分：`snapshotType=new/existing`

---

## 15. 代码中潜在债务（建议继续优化）

1. `sync-feishu` 历史逻辑仍在，建议后续删除或隔离
2. `sync-dingtalk` 方法体较长，建议拆 service 层
3. 建议增加“批量写入视频/快照”以减少钉钉 API 调用次数
4. 建议增加本地执行日志落盘（刷新页面不丢）
5. 建议新增数据质量检查：
   - 无 `postId` 占比
   - `delta` 异常值报警

---

## 16. 交接给 AI 同事的建议提示词

可直接给下一位同事/AI：

1. “先阅读 `PROJECT_HANDOVER_2026-05-29.md`，不要重构抓取逻辑，优先保证 `sync-dingtalk` 稳定性与可观测性。”
2. “先做集成测试：4平台各1红人，验证红人表/视频表/快照表都落数据并归档。”
3. “在保证现有功能不回归前，按如下顺序优化：批量写入 -> 日志持久化 -> 仪表盘口径模板化。”

---

## 17. 最后说明

- 当前项目已经从“本地 MVP 验证”进入“可运行但仍需工程化收口”阶段。
- 主要风险已从“接口不可用”转移到“稳定性与口径一致性”。
- 这份文档优先保证新同事接手后能快速定位历史坑位与当前真实状态。

---

## 附录A：问题流水账（逐条移交版）

> 用于“事无巨细”交接。以下每条均来自本次沟通中实际出现过的症状或决策。

1. Actor ID 404：`record-not-found`（输入了错误 actor 标识）
2. Instagram 输入 400：`input.username is required`
3. Instagram 输入 400：`input.username must be array`
4. `apify/instagram-post-scraper` 与 `nH2AH...` 输入模型不一致导致混乱
5. 用户将 Apify userId 误当 token 使用（鉴权失败）
6. Apify 401：`user-or-token-not-found`
7. Apify 返回不为空，但本地过滤后为空（近天数过滤）
8. 前端“红色报错”可见性问题（已改为页面提示）
9. 导出 CSV/JSON 在无结果时不可用（属于设计行为，非异常）
10. 需求变更：加入本底数据调试（避免扣费）
11. 需求变更：红人命中后新增“命中帖子分表显示”
12. 需求变更：转向飞书工作流（后又迁钉钉）
13. 飞书字段名不一致：`FieldNameNotFound`
14. 飞书字段类型不一致：`TextFieldConvFail`
15. 飞书 URL 字段对象结构处理问题（已修）
16. 飞书阶段大量重跑引发成本焦虑（流程转钉钉前未限流）
17. YouTube video/short 平台分流策略讨论后定稿
18. 平台字段枚举新增（instagramreels/youtubevideo/youtubeshort/tiktok）
19. “自动映射”与“固定 actor 输入框”UI认知冲突（已改展示为自动路由）
20. TikTok 输入参数错误：`newestPostDate must be string`（已改用 `oldestPostDateUnified`）
21. TikTok add-on 成本项（transcript/comment/download）默认关闭
22. 钉钉迁移初期：调用错误路由 `topapi/notable/*` -> `Invalid method`
23. 钉钉正确路由确认：`/v1.0/notable/bases/...`
24. operatorId 识别错误：传 `userid` 触发 `paramError-operatorId`
25. `qyapi_get_member` 权限缺失阻塞 user 查询（后开通）
26. 多个候选 userId 无效（`The user could not be found`）
27. 确认可用 userId 后拿到 unionId
28. list records 限制：`maxResults 1-100`
29. update API 错用 PATCH 路由导致 not found（改 PUT /records）
30. 旧进程未重启导致“修复后仍报旧错”
31. Node fetch 到 Apify 失败而 curl 正常（IPv4/IPv6 DNS 栈差异）
32. 加 `dns.setDefaultResultOrder('ipv4first')`
33. 视频重复登记（URL 形态差异）-> 去重键改 `platform+postId`
34. URL 规范化（去噪参数/尾斜杠）作为兜底键
35. youtubeshot/youtubeshort 口径统一
36. YouTube subscriber 字段遗漏（`numberOfSubscribers`）已补
37. Instagram raw 不含粉丝字段（非代码问题，源数据限制）
38. 快照与发布口径混算导致月看板失真
39. 快照新增字段补齐：`isFirstSeen/snapshotType/firstSeenAt`
40. 归档要求升级：每次工作流必须存 raw/cleaned/summary
41. 前端刷新丢日志（未持久化）
42. 调用量风险：400红人可能触达配额上限（需批量写+分层调度）

---

## 附录B：交接检查清单（执行即验收）

1. 启动后 `GET /api/health` 正常
2. 控制台自动读取 `.env` 生效
3. `limitInfluencers=1` 跑通 4 平台任一行
4. 红人表回填（url/url2/url3、是否出视频、粉丝）正常
5. 视频表无重复（同 postId 走 update）
6. 快照表写入并含 `isFirstSeen/snapshotType/firstSeenAt`
7. `data/raw` 与 `data/output` 生成三类归档文件
8. 月度看板口径拆分（视频表=发布，快照表=增量）

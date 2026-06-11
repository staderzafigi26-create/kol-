# .env 填写说明（钉钉版）

## 必填项

- `PORT`
  - 本地服务端口，默认 `3000`
  - 示例：`PORT=3000`

- `APIFY_API_TOKEN`
  - Apify API Token，用于调用抓取 Actor
  - 示例：`APIFY_API_TOKEN=apify_api_xxx`

- `DINGTALK_APP_KEY`
  - 钉钉企业内部应用 AppKey
  - 示例：`DINGTALK_APP_KEY=dingxxxx`

- `DINGTALK_APP_SECRET`
  - 钉钉企业内部应用 AppSecret
  - 示例：`DINGTALK_APP_SECRET=xxxx`

- `DINGTALK_OPERATOR_ID`
  - 钉钉操作人 ID（建议填 `userid`）
  - 后端会自动转成 `unionId`
  - 示例：`DINGTALK_OPERATOR_ID=17731939211035587`

- `DINGTALK_DOC_ID`
  - 多维表 baseId（从钉钉链接的 `/nodes/{baseId}` 提取）
  - 示例：`DINGTALK_DOC_ID=mExel2BLV5BllyM1Sm56l7mPJgk9rpMq`

- `DINGTALK_INFLUENCER_TABLE_ID`
  - 红人表 sheetId
  - 示例：`DINGTALK_INFLUENCER_TABLE_ID=hERWDMS`

- `DINGTALK_VIDEO_TABLE_ID`
  - 视频表 sheetId
  - 示例：`DINGTALK_VIDEO_TABLE_ID=Lxu42qk`

## 可选项

- `DINGTALK_SNAPSHOT_TABLE_ID`
  - 快照表 sheetId（用于周/月增量）
  - 不填则不写快照
  - 示例：`DINGTALK_SNAPSHOT_TABLE_ID=dIHFmyP`

## 权限要求

钉钉应用至少开通：

1. 多维表读写相关权限（notable bases/sheets/records）
2. `qyapi_get_member`（用于 userid 转 unionId）

## 注意事项

1. `.env` 里 `=` 后不要带空格。
2. 修改 `.env` 后需要重启服务。
3. 不要把真实 `.env` 提交到代码仓库。

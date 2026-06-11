# Yozma 红人数据中台部署说明

这份说明用于把当前 Node/Express 中台部署到 GitHub 和阿里云服务器，方便后续持续修改并同步线上。

## 1. 推荐上线顺序

1. 先把代码推到 GitHub 私有仓库。
2. 在阿里云 ECS 或轻量应用服务器拉取仓库。
3. 在服务器单独创建 `.env`，不要把密钥提交到 GitHub。
4. 用 `pm2` 常驻运行 Node 服务。
5. 用 Nginx 绑定域名、反向代理到本地端口。
6. 配置 HTTPS 证书。

## 2. GitHub 仓库内容

仓库只保存代码和部署说明，以下内容不要提交：

- `.env`、`.env.backup*`
- `抓取设置.env`
- `APIkey.rtf`
- `config/*.env`
- `node_modules/`
- `data/local/`
- `data/raw/`
- `data/output/`
- `data/logs/`
- `data/reports/`

原因：这些文件包含密钥、达人数据、订单数据、抓取原始结果或运行日志。线上需要数据时，应该通过服务器私密上传、钉钉/飞书同步或后端任务生成。

## 3. 服务器环境变量

在服务器项目目录创建 `.env`：

```env
PORT=3000
HOST=0.0.0.0

APIFY_API_TOKEN=

DINGTALK_APP_KEY=
DINGTALK_APP_SECRET=
DINGTALK_OPERATOR_ID=
DINGTALK_DOC_ID=
DINGTALK_DOC_URL=
DINGTALK_INFLUENCER_TABLE_ID=
DINGTALK_VIDEO_TABLE_ID=
DINGTALK_SNAPSHOT_TABLE_ID=
```

本地开发可以继续使用 `HOST=127.0.0.1`；服务器必须使用 `HOST=0.0.0.0`，否则 Nginx 或外部访问可能连不上。

## 4. 阿里云服务器部署命令

首次部署：

```bash
git clone <你的 GitHub 仓库地址>
cd 红人数据检测追踪工具
npm ci
cp .env.example .env
# 编辑 .env，填入线上 token 和钉钉配置
npm install -g pm2
pm2 start server.js --name yozma-influencer-center
pm2 save
```

后续更新：

```bash
git pull
npm ci
pm2 restart yozma-influencer-center
```

## 5. Nginx 反向代理示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

域名解析到服务器公网 IP 后，再配置 HTTPS 证书。

## 6. 上线注意事项

- 建议 GitHub 仓库先设为 Private。
- 中国大陆服务器绑定域名通常需要备案；如果想快速上线给团队看，可以优先选阿里云香港或海外服务器。
- 不要让团队成员直接触发 Apify 全量抓取，避免费用失控。
- 推荐先上线只读版：看板、红人库、视频上线、出单分析、导出报表；抓取和导入动作由 Ryan 或运营负责人控制。

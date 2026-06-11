#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'ryan.env');

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i), line.slice(i + 1)];
      })
  );
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.errcode) {
    throw new Error(`${response.status} ${json.message || json.errmsg || json.errcode || '请求失败'}`);
  }
  return json;
}

function notableUrl(baseId, suffix, operatorId) {
  return `https://api.dingtalk.com/v1.0/notable/bases/${encodeURIComponent(baseId)}${suffix}?operatorId=${encodeURIComponent(operatorId)}`;
}

async function main() {
  let configText = fs.readFileSync(CONFIG_PATH, 'utf8');
  const config = parseEnv(configText);
  const required = ['DINGTALK_APP_KEY', 'DINGTALK_APP_SECRET', 'DINGTALK_OPERATOR_ID', 'DINGTALK_DOC_ID'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length) throw new Error(`Ryan 配置缺少: ${missing.join(', ')}`);

  const token = await requestJson('https://api.dingtalk.com/v1.0/oauth2/accessToken', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ appKey: config.DINGTALK_APP_KEY, appSecret: config.DINGTALK_APP_SECRET })
  });
  const headers = {
    'content-type': 'application/json',
    'x-acs-dingtalk-access-token': token.accessToken
  };
  const baseId = config.DINGTALK_DOC_ID;
  const operatorId = config.DINGTALK_OPERATOR_ID;

  const schemas = {
    红人表: [
      ['红人名称', 'text'],
      ['平台', 'text'],
      ['是否监控', 'text'],
      ['红人链接', 'url'],
      ['样品型号', 'text'],
      ['红人粉丝数据', 'number'],
      ['是否出视频', 'text'],
      ['url', 'url'],
      ['url2', 'url'],
      ['url3', 'url']
    ],
    视频表: [
      ['红人名称', 'text'],
      ['平台', 'text'],
      ['是否监控', 'text'],
      ['id', 'text'],
      ['timestamp', 'text'],
      ['url', 'url'],
      ['caption', 'text'],
      ['commentsCount', 'number'],
      ['likesCount', 'number'],
      ['videoViewCount', 'number'],
      ['videoPlayCount', 'number'],
      ['videoUrl', 'text'],
      ['displayUrl', 'text']
    ],
    快照表: [
      ['runId', 'text'],
      ['capturedAt', 'number'],
      ['platform', 'text'],
      ['红人名称', 'text'],
      ['postKey', 'text'],
      ['postId', 'text'],
      ['postUrl', 'url'],
      ['isProductPost', 'text'],
      ['是否监控', 'text'],
      ['isFirstSeen', 'text'],
      ['snapshotType', 'text'],
      ['firstSeenAt', 'number'],
      ['videoPlayCount', 'number'],
      ['videoViewCount', 'number'],
      ['likesCount', 'number'],
      ['commentsCount', 'number'],
      ['sharesCount', 'number'],
      ['playDelta', 'number'],
      ['viewDelta', 'number'],
      ['likeDelta', 'number'],
      ['commentDelta', 'number'],
      ['shareDelta', 'number']
    ]
  };

  const sheetList = await requestJson(notableUrl(baseId, '/sheets', operatorId), { headers });
  const sheetsByName = new Map((sheetList.value || []).map((sheet) => [sheet.name, sheet]));

  for (const [sheetName, fields] of Object.entries(schemas)) {
    let sheet = sheetsByName.get(sheetName);
    if (!sheet) {
      sheet = await requestJson(notableUrl(baseId, '/sheets', operatorId), {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: sheetName })
      });
      sheetsByName.set(sheetName, sheet);
    }

    const fieldList = await requestJson(notableUrl(baseId, `/sheets/${encodeURIComponent(sheet.id)}/fields`, operatorId), {
      headers
    });
    const existingNames = new Set((fieldList.value || []).map((field) => field.name));
    for (const [name, type] of fields) {
      if (existingNames.has(name)) continue;
      await requestJson(notableUrl(baseId, `/sheets/${encodeURIComponent(sheet.id)}/fields`, operatorId), {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, type })
      });
    }
  }

  const influencerSheet = sheetsByName.get('红人表');
  const videoSheet = sheetsByName.get('视频表');
  const snapshotSheet = sheetsByName.get('快照表');
  const records = await requestJson(notableUrl(baseId, `/sheets/${encodeURIComponent(influencerSheet.id)}/records`, operatorId), {
    headers
  });
  if (!(records.records || []).some((record) => record.fields?.['红人名称'] === 'freego.judah')) {
    const profileUrl = 'https://www.tiktok.com/@freego.judah';
    await requestJson(notableUrl(baseId, `/sheets/${encodeURIComponent(influencerSheet.id)}/records`, operatorId), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        records: [
          {
            fields: {
              红人名称: 'freego.judah',
              平台: 'tiktok',
              是否监控: '是',
              红人链接: { text: profileUrl, link: profileUrl },
              样品型号: 'yozma, yozmasport'
            }
          }
        ]
      })
    });
  }

  const replacements = {
    DINGTALK_INFLUENCER_TABLE_ID: influencerSheet.id,
    DINGTALK_VIDEO_TABLE_ID: videoSheet.id,
    DINGTALK_SNAPSHOT_TABLE_ID: snapshotSheet.id
  };
  for (const [key, value] of Object.entries(replacements)) {
    configText = configText.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
  }
  fs.writeFileSync(CONFIG_PATH, configText, { mode: 0o600 });

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseId,
        tables: {
          influencer: influencerSheet.id,
          video: videoSheet.id,
          snapshot: snapshotSheet.id
        },
        seedInfluencer: 'freego.judah'
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

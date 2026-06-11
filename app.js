const els = {
  serviceStatus: document.getElementById('serviceStatus'),
  dingtalkStatus: document.getElementById('dingtalkStatus'),
  apifyStatus: document.getElementById('apifyStatus'),
  dingtalkLink: document.getElementById('dingtalkLink'),
  workflowKeywords: document.getElementById('workflowKeywords'),
  workflowDays: document.getElementById('workflowDays'),
  workflowMaxItems: document.getElementById('workflowMaxItems'),
  workflowLimitInfluencers: document.getElementById('workflowLimitInfluencers'),
  workflowPlatformFilter: document.getElementById('workflowPlatformFilter'),
  discoveryWindow: document.getElementById('discoveryWindow'),
  dashboardUpdatedAt: document.getElementById('dashboardUpdatedAt'),
  dashboardWeekRange: document.getElementById('dashboardWeekRange'),
  metricWeekVideos: document.getElementById('metricWeekVideos'),
  metricWeekCreators: document.getElementById('metricWeekCreators'),
  metricWeekViews: document.getElementById('metricWeekViews'),
  metricMonthVideos: document.getElementById('metricMonthVideos'),
  metricMonthCreators: document.getElementById('metricMonthCreators'),
  metricMonthViews: document.getElementById('metricMonthViews'),
  metricTotalVideos: document.getElementById('metricTotalVideos'),
  metricTotalViews: document.getElementById('metricTotalViews'),
  metricTotalCreators: document.getElementById('metricTotalCreators'),
  weeklyChart: document.getElementById('weeklyChart'),
  monthlyChart: document.getElementById('monthlyChart'),
  tierPeriodHint: document.getElementById('tierPeriodHint'),
  tierPeriodTabs: document.getElementById('tierPeriodTabs'),
  tierGrid: document.getElementById('tierGrid'),
  missingFollowers: document.getElementById('missingFollowers'),
  creatorLeaderboard: document.getElementById('creatorLeaderboard'),
  videoLeaderboard: document.getElementById('videoLeaderboard'),
  btnRefreshDashboard: document.getElementById('btnRefreshDashboard'),
  btnSaveSettings: document.getElementById('btnSaveSettings'),
  btnCheckConnection: document.getElementById('btnCheckConnection'),
  btnRunDiscovery: document.getElementById('btnRunDiscovery'),
  btnCheckMilestones: document.getElementById('btnCheckMilestones'),
  btnRefreshMilestones: document.getElementById('btnRefreshMilestones'),
  btnClearLog: document.getElementById('btnClearLog'),
  workflowStatus: document.getElementById('workflowStatus'),
  workflowLog: document.getElementById('workflowLog')
};

const actionButtons = [
  els.btnRefreshDashboard,
  els.btnSaveSettings,
  els.btnCheckConnection,
  els.btnRunDiscovery,
  els.btnCheckMilestones,
  els.btnRefreshMilestones
];

let currentConfig = {};
let latestDashboard = {};
let currentTierPeriod = 'total';

const tierPeriodCopy = {
  week: '周维度：仅统计本周上线视频对应的达人分层表现。',
  month: '月维度：仅统计本月上线视频对应的达人分层表现。',
  total: '累计维度：统计全部已登记视频对应的达人分层表现。'
};

function setChip(element, message, type) {
  element.textContent = message;
  element.className = `chip ${type}`;
}

function setStatus(message, type = '') {
  els.workflowStatus.textContent = message;
  els.workflowStatus.className = `status-message ${type}`;
}

function appendLog(message) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  els.workflowLog.textContent += `[${time}] ${message}\n`;
  els.workflowLog.scrollTop = els.workflowLog.scrollHeight;
}

function setBusy(isBusy) {
  actionButtons.forEach((button) => {
    button.disabled = isBusy;
  });
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(iso));
}

function formatDateShort(iso) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(new Date(iso));
}

function formatDateOnly(iso) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}

function formatMonthShort(iso) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit' }).format(new Date(iso));
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function clearElement(element) {
  while (element.firstChild) element.removeChild(element.firstChild);
}

function appendCell(row, value, className = '') {
  const cell = document.createElement('td');
  cell.textContent = value;
  if (className) cell.className = className;
  row.appendChild(cell);
  return cell;
}

function appendEmptyRow(tbody, columnCount, message) {
  const row = document.createElement('tr');
  const cell = appendCell(row, message, 'empty-cell');
  cell.colSpan = columnCount;
  tbody.appendChild(row);
}

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function renderLineChart(element, rows, { labelKey, labelFormatter }) {
  clearElement(element);
  const data = Array.isArray(rows) ? rows : [];
  if (!data.length) {
    element.textContent = '暂无趋势数据';
    return;
  }

  const width = 640;
  const height = 260;
  const padding = { top: 24, right: 24, bottom: 46, left: 46 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxVideos = Math.max(1, ...data.map((item) => Number(item.videos) || 0));
  const maxViews = Math.max(1, ...data.map((item) => Number(item.views) || 0));
  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
  const toX = (index) => padding.left + index * xStep;
  const toY = (value, max) => padding.top + chartHeight - (Number(value || 0) / max) * chartHeight;
  const videoPoints = data.map((item, index) => [toX(index), toY(item.videos, maxVideos), item]);
  const viewPoints = data.map((item, index) => [toX(index), toY(item.views, maxViews), item]);
  const pathFor = (points) => points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': '上线趋势折线图' });
  [0, 0.25, 0.5, 0.75, 1].forEach((ratio) => {
    const y = padding.top + ratio * chartHeight;
    svg.appendChild(svgEl('line', { x1: padding.left, y1: y, x2: width - padding.right, y2: y, class: 'chart-grid-line' }));
  });

  svg.appendChild(svgEl('path', { d: pathFor(viewPoints), class: 'line-chart-path views-line' }));
  svg.appendChild(svgEl('path', { d: pathFor(videoPoints), class: 'line-chart-path videos-line' }));

  data.forEach((item, index) => {
    const x = toX(index);
    const videoY = toY(item.videos, maxVideos);
    const viewY = toY(item.views, maxViews);
    const videoDot = svgEl('circle', { cx: x, cy: videoY, r: 4, class: 'line-dot videos-dot' });
    const viewDot = svgEl('circle', { cx: x, cy: viewY, r: 4, class: 'line-dot views-dot' });
    const title = svgEl('title');
    title.textContent = `${labelFormatter(item[labelKey])}：${item.videos || 0} 条，${formatNumber(item.views)} 播放`;
    videoDot.appendChild(title.cloneNode(true));
    viewDot.appendChild(title);
    svg.append(videoDot, viewDot);

    const label = svgEl('text', { x, y: height - 18, class: 'chart-x-label', 'text-anchor': 'middle' });
    label.textContent = labelFormatter(item[labelKey]);
    svg.appendChild(label);
  });

  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  legend.innerHTML = '<span><i class="legend-dot videos"></i>上线视频数</span><span><i class="legend-dot views"></i>播放量趋势</span>';
  element.append(svg, legend);
}

function renderTierBreakdown(data) {
  const breakdowns = data.tierBreakdowns || {};
  const tiers = breakdowns[currentTierPeriod] || data.tiers || [];
  clearElement(els.tierGrid);
  (tiers || []).forEach((tier) => {
    const card = document.createElement('article');
    card.className = `tier-card${tier.creators ? ' active' : ''}`;
    const title = document.createElement('h4');
    title.textContent = tier.label;
    const range = document.createElement('span');
    range.textContent = tier.range;
    const list = document.createElement('dl');
    [
      ['达人数量', `${tier.creators || 0} 位`],
      ['上线视频', `${tier.videos || 0} 条`],
      ['总播放量', formatNumber(tier.views)],
      ['平均播放', formatNumber(tier.avgViews)],
      ['最佳达人', tier.topCreator || '-']
    ].forEach(([term, detail]) => {
      const dt = document.createElement('dt');
      dt.textContent = term;
      const dd = document.createElement('dd');
      dd.textContent = detail;
      list.append(dt, dd);
    });
    card.append(title, range, list);
    els.tierGrid.appendChild(card);
  });
  els.tierPeriodHint.textContent = `${tierPeriodCopy[currentTierPeriod]} 头部 ≥50 万；腰部 10 万-49.9 万；尾部 1 万-9.9 万；微型 <1 万粉丝。`;
  els.tierPeriodTabs.querySelectorAll('button[data-tier-period]').forEach((button) => {
    button.classList.toggle('active', button.dataset.tierPeriod === currentTierPeriod);
  });
}

function renderDashboard(data) {
  latestDashboard = data || {};
  const summary = data.summary || {};
  els.metricWeekVideos.textContent = formatNumber(summary.thisWeekVideos);
  els.metricWeekCreators.textContent = formatNumber(summary.thisWeekCreators);
  els.metricWeekViews.textContent = formatNumber(summary.thisWeekViews);
  els.metricMonthVideos.textContent = formatNumber(summary.thisMonthVideos);
  els.metricMonthCreators.textContent = formatNumber(summary.thisMonthCreators);
  els.metricMonthViews.textContent = formatNumber(summary.thisMonthViews);
  els.metricTotalVideos.textContent = formatNumber(summary.totalVideos);
  els.metricTotalViews.textContent = formatNumber(summary.totalViews);
  els.metricTotalCreators.textContent = formatNumber(summary.totalCreators);
  els.dashboardUpdatedAt.textContent = `更新于 ${new Date(data.generatedAt).toLocaleTimeString('zh-CN', { hour12: false })}`;
  els.dashboardWeekRange.textContent = `本周：${formatDateOnly(data.currentWeek?.weekStart)} 至 ${formatDateOnly(data.currentWeek?.weekEnd)}；本月：${formatDateOnly(data.currentMonth?.monthStart)} 至 ${formatDateOnly(data.currentMonth?.monthEnd)}`;
  renderLineChart(els.weeklyChart, data.weekly || [], { labelKey: 'weekStart', labelFormatter: formatDateShort });
  renderLineChart(els.monthlyChart, data.monthly || [], { labelKey: 'monthStart', labelFormatter: formatMonthShort });
  renderTierBreakdown(data);
  els.missingFollowers.textContent = summary.missingFollowerCreators
    ? `还有 ${summary.missingFollowerCreators} 位达人缺少粉丝数，请在钉钉达人表补充“红人粉丝数据”。`
    : '达人粉丝分层数据完整。';

  clearElement(els.creatorLeaderboard);
  const creators = data.creatorLeaderboard || [];
  if (!creators.length) appendEmptyRow(els.creatorLeaderboard, 6, '暂无已登记达人数据');
  creators.forEach((creator, index) => {
    const row = document.createElement('tr');
    appendCell(row, String(index + 1));
    appendCell(row, creator.creator);
    appendCell(row, creator.tierLabel);
    appendCell(row, String(creator.videos || 0));
    appendCell(row, formatNumber(creator.views));
    appendCell(row, formatNumber(creator.avgViews));
    els.creatorLeaderboard.appendChild(row);
  });

  clearElement(els.videoLeaderboard);
  const videos = data.videoLeaderboard || [];
  if (!videos.length) appendEmptyRow(els.videoLeaderboard, 5, '暂无已登记视频数据');
  videos.forEach((video) => {
    const row = document.createElement('tr');
    appendCell(row, String(video.rank));
    const creatorCell = document.createElement('td');
    const link = document.createElement('a');
    link.href = video.postUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = video.creator;
    creatorCell.appendChild(link);
    creatorCell.append(` / ${video.platform}`);
    row.appendChild(creatorCell);
    appendCell(row, formatDate(video.publishedAt));
    appendCell(row, formatNumber(video.views));
    appendCell(row, `${Number(video.engagementRate || 0).toFixed(2)}%`);
    els.videoLeaderboard.appendChild(row);
  });
}

async function loadDashboard({ quiet = false, force = false } = {}) {
  if (!quiet) setStatus('正在从钉钉读取仪表盘数据...', '');
  const refresh = force || !quiet ? '&refresh=1' : '';
  const data = await requestJson(`/api/workflow/dashboard?weeks=8${refresh}`, {}, 30000);
  renderDashboard(data.dashboard || {});
  if (data.cached) els.dashboardUpdatedAt.textContent += '（缓存）';
  if (data.warning && quiet) appendLog(data.warning);
  if (!quiet) {
    setStatus(data.warning ? '钉钉暂时较慢，已保留最近一次仪表盘数据。' : '仪表盘已刷新。', data.warning ? '' : 'success');
    appendLog(data.warning || '仪表盘已从钉钉读取最新数据，不调用 Apify。');
  }
}

function readSettingsForm() {
  return {
    globalKeywords: els.workflowKeywords.value.trim(),
    days: Number(els.workflowDays.value || 7),
    maxItems: Number(els.workflowMaxItems.value || 50),
    limitInfluencers: Number(els.workflowLimitInfluencers.value || 200),
    platformFilter: els.workflowPlatformFilter.value || 'all'
  };
}

function applyConfig(config) {
  currentConfig = { ...currentConfig, ...config };
  els.workflowKeywords.value = currentConfig.globalKeywords || 'yozma,yozmasport';
  els.workflowDays.value = currentConfig.days || 7;
  els.workflowMaxItems.value = currentConfig.maxItems || 50;
  els.workflowLimitInfluencers.value = currentConfig.limitInfluencers || 200;
  els.workflowPlatformFilter.value = currentConfig.platformFilter || 'all';
  els.discoveryWindow.textContent = `${formatDate(currentConfig.weekStart)} 至 ${formatDate(currentConfig.weekEnd)}`;
  if (currentConfig.dingTalkUrl) els.dingtalkLink.href = currentConfig.dingTalkUrl;
}

async function requestJson(url, options = {}, timeoutMs = 0) {
  const controller = timeoutMs ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetch(url, controller ? { ...options, signal: controller.signal } : options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || `请求失败：HTTP ${response.status}`);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('请求超时，请检查网络后重试。');
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function loadConfig() {
  try {
    await requestJson('/api/health');
    setChip(els.serviceStatus, '运行正常', 'success');
    const data = await requestJson('/api/workflow/config');
    applyConfig(data.config || {});
    setChip(els.dingtalkStatus, data.config.dingTalkConfigured ? '已连接' : '未配置', data.config.dingTalkConfigured ? 'success' : 'error');
    setChip(els.apifyStatus, data.config.apifyConfigured ? '已配置' : '未配置', data.config.apifyConfigured ? 'success' : 'error');
    setStatus('控制台已准备好。', 'success');
    appendLog('已加载本地配置。Token 和钉钉密钥保存在后台，不会显示在页面中。');
    try {
      await loadDashboard({ quiet: true });
    } catch (error) {
      appendLog(`仪表盘首次加载失败，可点击刷新重试：${error.message}`);
    }
  } catch (error) {
    setChip(els.serviceStatus, '连接失败', 'error');
    setStatus(`初始化失败：${error.message}`, 'error');
    appendLog(`初始化失败：${error.message}`);
  }
}

async function saveSettings({ quiet = false } = {}) {
  const data = await requestJson('/api/workflow/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(readSettingsForm())
  });
  applyConfig(data.config || {});
  if (!quiet) {
    setStatus('抓取配置已保存。', 'success');
    appendLog(`已保存配置：关键词=${currentConfig.globalKeywords}，平台=${currentConfig.platformFilter}，每位达人最多=${currentConfig.maxItems} 条。`);
  }
  return data.config;
}

async function withBusy(task) {
  setBusy(true);
  try {
    await task();
  } catch (error) {
    setStatus(`执行失败：${error.message}`, 'error');
    appendLog(`执行失败：${error.message}`);
  } finally {
    setBusy(false);
  }
}

async function checkConnection() {
  await withBusy(async () => {
    setStatus('正在检查钉钉连接...', '');
    appendLog('开始检查钉钉连接，不调用 Apify。');
    const data = await requestJson('/api/workflow/dingtalk-status', {}, 10000);
    setStatus('钉钉连接正常。', 'success');
    appendLog(`连接正常：三张钉钉数据表均可访问，耗时 ${data.elapsedMs || 0} ms。`);
  });
}

async function runDiscovery() {
  if (!window.confirm('本次操作会调用 Apify 扫描达人主页，并消耗相应额度。确认立即执行吗？')) return;
  await withBusy(async () => {
    const settings = await saveSettings({ quiet: true });
    setStatus('正在扫描达人主页，请稍候...', '');
    appendLog(`开始发现新视频：窗口=${formatDate(settings.weekStart)} 至 ${formatDate(settings.weekEnd)}。`);
    const data = await requestJson('/api/workflow/sync-dingtalk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, publishedBefore: settings.weekEnd })
    });
    appendLog(`扫描完成：处理达人 ${data.processedInfluencers || 0} 位。`);
    (data.report || []).forEach((item) => {
      appendLog(
        `${item.platform} | ${item.influencerInput} | 抓取 ${item.scraped || 0} | 命中 ${item.matched || 0} | 新增视频 ${item.videoCreated || 0} | 跳过 ${item.videoSkipped || 0}`
      );
    });
    await loadDashboard({ quiet: true, force: true });
    setStatus(`新视频发现完成：处理达人 ${data.processedInfluencers || 0} 位。`, 'success');
  });
}

async function runMilestones(dryRun) {
  if (!dryRun && !window.confirm('只会刷新已到达 7 天或 30 天节点的视频，并调用 Apify。确认继续吗？')) return;
  await withBusy(async () => {
    setStatus(dryRun ? '正在免费检查到期视频...' : '正在刷新到期视频...', '');
    appendLog(dryRun ? '开始免费检查视频里程碑，不调用 Apify。' : '开始刷新到期视频。');
    const data = await requestJson('/api/workflow/refresh-dingtalk-milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun })
    });
    if (dryRun) {
      appendLog(`检查完成：当前到期视频 ${data.due.length} 条。`);
      (data.due || []).forEach((item) => appendLog(`${item.platform} | ${item.milestone} | ${item.postUrl}`));
      setStatus(`检查完成：当前到期视频 ${data.due.length} 条，未调用 Apify。`, 'success');
    } else {
      appendLog(`刷新完成：成功更新 ${data.refreshed || 0} 条。`);
      (data.report || []).forEach((item) => appendLog(`${item.platform} | ${item.milestone} | ${item.status} | ${item.postUrl}`));
      await loadDashboard({ quiet: true, force: true });
      setStatus(`到期视频刷新完成：更新 ${data.refreshed || 0} 条。`, 'success');
    }
  });
}

els.btnSaveSettings.addEventListener('click', () => withBusy(() => saveSettings()));
els.btnRefreshDashboard.addEventListener('click', () => withBusy(() => loadDashboard()));
els.tierPeriodTabs.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-tier-period]');
  if (!button) return;
  currentTierPeriod = button.dataset.tierPeriod || 'total';
  renderTierBreakdown(latestDashboard);
});
els.btnCheckConnection.addEventListener('click', checkConnection);
els.btnRunDiscovery.addEventListener('click', runDiscovery);
els.btnCheckMilestones.addEventListener('click', () => runMilestones(true));
els.btnRefreshMilestones.addEventListener('click', () => runMilestones(false));
els.btnClearLog.addEventListener('click', () => {
  els.workflowLog.textContent = '';
  setStatus('日志已清空。');
});

loadConfig();

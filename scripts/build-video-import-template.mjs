import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputPath = '/Users/ryan/Desktop/红人数据检测追踪工具/data/templates/video-import-template.xlsx';

const workbook = Workbook.create();
const sheet = workbook.worksheets.add('视频链接导入模板');
sheet.showGridLines = false;

sheet.getRange('A1:F1').merge();
sheet.getRange('A1').values = [['Yozma 红人视频链接批量导入模板']];
sheet.getRange('A2:F2').merge();
sheet.getRange('A2').values = [['只需要填写 A 列“视频链接”即可导入；红人名称、平台、上线时间都可以留空，系统会尽量自动识别。']];

sheet.getRange('A4:F4').values = [[
  '视频链接（必填）',
  '红人名称（可选）',
  '平台（可选，可自动识别）',
  '上线时间（可选）',
  '是否监控（可选）',
  '备注（可选）'
]];
sheet.getRange('A5:F8').values = [
  ['https://www.tiktok.com/@example/video/1234567890', '', '', '', '是', '只填第一列也可以导入'],
  ['https://www.youtube.com/shorts/abcdefghijk', '', '', '', '是', 'YouTube Shorts 会自动识别'],
  ['https://www.instagram.com/reel/ABC123/', '', '', '', '是', 'Instagram Reels 会自动识别'],
  ['', '', '', '', '', '从第 8 行继续往下粘贴你的真实视频链接']
];

sheet.getRange('A1:F1').format = {
  fill: '#111111',
  font: { bold: true, color: '#FFFFFF', size: 16 },
  horizontalAlignment: 'center'
};
sheet.getRange('A2:F2').format = {
  fill: '#2A0B0E',
  font: { color: '#FFD7DA' },
  wrapText: true
};
sheet.getRange('A4:F4').format = {
  fill: '#E50914',
  font: { bold: true, color: '#FFFFFF' },
  horizontalAlignment: 'center'
};
sheet.getRange('A5:F100').format = {
  fill: '#FFF7F7',
  font: { color: '#1A1A1A' },
  wrapText: true
};
sheet.getRange('A4:F100').format.borders = { preset: 'all', style: 'thin', color: '#E0E0E0' };
sheet.getRange('A:A').format.columnWidthPx = 430;
sheet.getRange('B:B').format.columnWidthPx = 170;
sheet.getRange('C:C').format.columnWidthPx = 190;
sheet.getRange('D:D').format.columnWidthPx = 150;
sheet.getRange('E:E').format.columnWidthPx = 130;
sheet.getRange('F:F').format.columnWidthPx = 260;
sheet.getRange('A1:F2').format.rowHeightPx = 30;
sheet.getRange('A4:F100').format.rowHeightPx = 30;
sheet.freezePanes.freezeRows(4);

sheet.dataValidations.add({ range: 'C5:C100', rule: { type: 'list', values: ['instagramreels', 'tiktok', 'youtubevideo', 'youtubeshort'] } });
sheet.dataValidations.add({ range: 'E5:E100', rule: { type: 'list', values: ['是', '否'] } });

await fs.mkdir('/Users/ryan/Desktop/红人数据检测追踪工具/data/templates', { recursive: true });
const preview = await workbook.render({ sheetName: '视频链接导入模板', range: 'A1:F10', scale: 1, format: 'png' });
await fs.writeFile('/Users/ryan/Desktop/红人数据检测追踪工具/data/templates/video-import-template-preview.png', new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);

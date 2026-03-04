const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'pages', 'equipment-monitor-diagnosis.html');
const cssPath = path.join(__dirname, 'assets', 'equipment-monitor-diagnosis.css');
const jsPath = path.join(__dirname, 'assets', 'equipment-monitor-diagnosis.js');

const buf = fs.readFileSync(htmlPath);

// 简单判断是否为 UTF-16LE（包含 BOM 或 0 字节间隔）
let html;
if ((buf[0] === 0xff && buf[1] === 0xfe) || buf.slice(0, 10).includes(0x00)) {
  html = buf.toString('utf16le');
  console.log('Detected UTF-16LE, converting to UTF-8...');
} else {
  html = buf.toString('utf8');
  console.log('Detected UTF-8.');
}

const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>', styleStart);
const scriptStart = html.lastIndexOf('<script');
const scriptOpenEnd = html.indexOf('>', scriptStart);
const scriptEnd = html.indexOf('</script>', scriptOpenEnd);

if (styleStart === -1 || styleEnd === -1 || scriptStart === -1 || scriptEnd === -1) {
  console.error('Cannot locate <style> or <script> block, abort.');
  process.exit(1);
}

const css = html.slice(styleStart + '<style>'.length, styleEnd).trim();
const js = html.slice(scriptOpenEnd + 1, scriptEnd).trim();

fs.writeFileSync(cssPath, css, 'utf8');
fs.writeFileSync(jsPath, js, 'utf8');

const beforeStyle = html.slice(0, styleStart);
const afterStyle = html.slice(styleEnd + '</style>'.length, scriptStart);
const afterScript = html.slice(scriptEnd + '</script>'.length);

const newHtml =
  beforeStyle +
  '    <link rel="stylesheet" href="../assets/equipment-monitor-diagnosis.css">\n' +
  afterStyle +
  '    <script src="../assets/equipment-monitor-diagnosis.js"></script>\n' +
  afterScript;

fs.writeFileSync(htmlPath, newHtml, 'utf8');

console.log('CSS lines:', css.split(/\r?\n/).length);
console.log('JS lines:', js.split(/\r?\n/).length);
console.log('New HTML lines:', newHtml.split(/\r?\n/).length);
console.log('Done.');


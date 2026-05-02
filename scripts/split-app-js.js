const fs = require('fs');
const path = require('path');

const root = process.cwd();
const appPath = path.join(root, 'app.js');
const indexPath = path.join(root, 'index.html');
const jsDir = path.join(root, 'js');

if (!fs.existsSync(appPath)) throw new Error('app.js not found');
if (!fs.existsSync(indexPath)) throw new Error('index.html not found');
if (!fs.existsSync(jsDir)) fs.mkdirSync(jsDir);

let app = fs.readFileSync(appPath, 'utf8');
let index = fs.readFileSync(indexPath, 'utf8');

function findFunctionStart(code, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(', 'm');
  const m = re.exec(code);
  return m ? m.index : -1;
}

function sliceFromTo(code, startName, endName) {
  const start = findFunctionStart(code, startName);
  if (start < 0) throw new Error(`Missing start function ${startName}`);
  const end = endName ? findFunctionStart(code, endName) : code.length;
  if (endName && end < 0) throw new Error(`Missing end function ${endName}`);
  return code.slice(start, end).trim() + '\n';
}

function beforeFunction(code, name) {
  const idx = findFunctionStart(code, name);
  if (idx < 0) throw new Error(`Missing function ${name}`);
  return code.slice(0, idx).trim() + '\n';
}

function removeAutoInit(code) {
  return code.replace(/\n?init\(\);\s*$/m, '').trimEnd() + '\n';
}

app = removeAutoInit(app);

const files = [
  {
    path: 'js/trille-state.js',
    content: beforeFunction(app, 'init'),
  },
  {
    path: 'js/trille-core.js',
    content: sliceFromTo(app, 'init', 'setDark'),
  },
  {
    path: 'js/trille-navigation.js',
    content: sliceFromTo(app, 'setDark', 'renderTypeGrid'),
  },
  {
    path: 'js/trille-editor.js',
    content: sliceFromTo(app, 'renderTypeGrid', 'toggleCheck'),
  },
  {
    path: 'js/trille-board-actions.js',
    content: sliceFromTo(app, 'toggleCheck', 'renderStats'),
  },
  {
    path: 'js/trille-insights.js',
    content: sliceFromTo(app, 'renderStats', 'init'),
  },
  {
    path: 'js/trille-bootstrap.js',
    content: "init();\n",
  },
];

for (const file of files) {
  fs.writeFileSync(path.join(root, file.path), file.content);
}

const scriptBlock = files.map(file => `<script src="${file.path}"></script>`).join('\n');

index = index
  .replace(/\s*<script src="board-subcards-fix\.js"><\/script>/g, '')
  .replace(/\s*<script src="app\.js"><\/script>/, '\n' + scriptBlock);

fs.writeFileSync(indexPath, index.trimEnd() + '\n');
fs.unlinkSync(appPath);

for (const oldFile of ['board-subcards-fix.js']) {
  const p = path.join(root, oldFile);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

console.log('Split app.js into smaller Trille modules.');

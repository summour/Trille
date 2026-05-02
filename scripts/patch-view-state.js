const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'app.js');
let js = fs.readFileSync(file, 'utf8');

function scanFunctionRange(code, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{', 'm');
  const m = re.exec(code);
  if (!m) return null;
  const open = code.indexOf('{', m.index);
  let depth = 0, quote = null, line = false, block = false, tmpl = 0;
  for (let i = open; i < code.length; i++) {
    const c = code[i], n = code[i + 1];
    if (line) { if (c === '\n') line = false; continue; }
    if (block) { if (c === '*' && n === '/') { block = false; i++; } continue; }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (quote === '`' && c === '$' && n === '{') { tmpl++; i++; continue; }
      if (quote === '`' && tmpl > 0) { if (c === '{') tmpl++; if (c === '}') tmpl--; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && n === '/') { line = true; i++; continue; }
    if (c === '/' && n === '*') { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) return { start: m.index, end: i + 1 }; }
  }
  return null;
}

function replaceFunction(code, name, replacement) {
  const r = scanFunctionRange(code, name);
  if (!r) return code + '\n\n' + replacement + '\n';
  return code.slice(0, r.start) + replacement + code.slice(r.end);
}

const helper = `function rerenderCardSourceView(){
  const source = addSourceView || curView;

  if (source === 'board' && activeBoardId) {
    const card = cards.find(c => c.id === activeBoardId);
    if (card) {
      openBoard(activeBoardId);
      return;
    }
  }

  if (source === 'boards' && activeFolderId) {
    renderFolderBoards();
    document.getElementById('view-home')?.classList.remove('active');
    document.getElementById('view-board')?.classList.remove('active');
    document.getElementById('view-boards')?.classList.add('active');
    document.querySelectorAll('.nbtn').forEach(b => b.classList.remove('active'));
    curView = 'boards';
    return;
  }

  switchView(source || 'home');
}`;

js = replaceFunction(js, 'rerenderCardSourceView', helper);

// Ensure addSourceView exists even when curView is declared in a multi-variable declaration.
if (!/\baddSourceView\b/.test(js)) {
  js = js.replace(/(let\s+curView\s*=\s*['"]home['"][^;]*;)/, '$1\nlet addSourceView=null;');
}

// Ensure board back button also records the current view.
js = js.replace(
  /document\.getElementById\('board-back-btn'\)\.onclick=\(\)=>\{document\.getElementById\('view-board'\)\.classList\.remove\('active'\);document\.getElementById\('view-boards'\)\.classList\.add\('active'\);\};/,
  "document.getElementById('board-back-btn').onclick=()=>{document.getElementById('view-board').classList.remove('active');document.getElementById('view-boards').classList.add('active');curView='boards';};"
);

// If saveCard does not call the helper yet, add it after save().
const saveRange = scanFunctionRange(js, 'saveCard');
if (saveRange) {
  const saveFn = js.slice(saveRange.start, saveRange.end);
  if (!/rerenderCardSourceView\s*\(/.test(saveFn)) {
    const patched = saveFn.replace(/save\(\);/, "save();\n  rerenderCardSourceView();\n  addSourceView=null;");
    js = js.slice(0, saveRange.start) + patched + js.slice(saveRange.end);
  }
}

fs.writeFileSync(file, js);
console.log('Patched card save view state.');

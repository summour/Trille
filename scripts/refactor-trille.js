const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'index.html');
const cssPath = path.join(process.cwd(), 'style.css');
const jsPath = path.join(process.cwd(), 'app.js');

let html = fs.readFileSync(indexPath, 'utf8');
let css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
let js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';

const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
if (styleMatch) {
  css = styleMatch[1].trim() + '\n';
  html = html.replace(styleMatch[0], '<link rel="stylesheet" href="style.css"/>');
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
if (inlineScripts.length) {
  const scriptMatch = inlineScripts[inlineScripts.length - 1];
  js = scriptMatch[1].trim() + '\n';
  html = html.slice(0, scriptMatch.index) + '<script src="app.js"></script>' + html.slice(scriptMatch.index + scriptMatch[0].length);
}

function scanFunctionRange(code, name) {
  const fnRe = new RegExp('function\\s+' + name + '\\s*\\(([^)]*)\\)\\s*\\{', 'm');
  const m = fnRe.exec(code);
  if (!m) return null;
  const open = code.indexOf('{', m.index);
  let depth = 0;
  let quote = null;
  let templateDepth = 0;
  let lineComment = false;
  let blockComment = false;
  for (let i = open; i < code.length; i++) {
    const c = code[i];
    const n = code[i + 1];
    const p = code[i - 1];
    if (lineComment) {
      if (c === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (c === '*' && n === '/') { blockComment = false; i++; }
      continue;
    }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (quote === '`' && c === '$' && n === '{') { templateDepth++; i++; continue; }
      if (quote === '`' && templateDepth > 0) {
        if (c === '{') templateDepth++;
        if (c === '}') templateDepth--;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && n === '/') { lineComment = true; i++; continue; }
    if (c === '/' && n === '*') { blockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}') {
      depth--;
      if (depth === 0) return { start: m.index, open, end: i + 1, params: m[1].split(',').map(s => s.trim()).filter(Boolean) };
    }
  }
  return null;
}

function replaceRange(code, range, replacement) {
  return code.slice(0, range.start) + replacement + code.slice(range.end);
}

function injectAtFunctionStart(code, name, getInsertion) {
  const range = scanFunctionRange(code, name);
  if (!range) return code;
  const bodyStart = range.open + 1;
  const bodyPreview = code.slice(bodyStart, Math.min(range.end, bodyStart + 500));
  const insertion = typeof getInsertion === 'function' ? getInsertion(range) : getInsertion;
  const marker = insertion.trim().split('\n')[0].trim();
  if (bodyPreview.includes(marker)) return code;
  return code.slice(0, bodyStart) + insertion + code.slice(bodyStart);
}

function patchFunctionBody(code, name, mutator) {
  const range = scanFunctionRange(code, name);
  if (!range) return code;
  const fn = code.slice(range.start, range.end);
  const openOffset = fn.indexOf('{');
  const before = fn.slice(0, openOffset + 1);
  const body = fn.slice(openOffset + 1, -1);
  const after = '}';
  const nextBody = mutator(body, range);
  return replaceRange(code, range, before + nextBody + after);
}

if (!/\bcurView\b/.test(js)) {
  js = "let curView = 'home';\nlet addSourceView = null;\n" + js;
} else if (!/\baddSourceView\b/.test(js)) {
  js = js.replace(/((?:let|var|const)\s+curView\s*=\s*[^;]+;)/, "$1\nlet addSourceView = null;");
}

js = injectAtFunctionStart(js, 'showView', range => {
  const viewParam = range.params[0] || 'viewName';
  return `\n  curView = ${viewParam};`;
});

js = injectAtFunctionStart(js, 'openFolder', "\n  curView = 'boards';");
js = injectAtFunctionStart(js, 'openBoard', "\n  curView = 'board';");

for (const name of ['openCardModal', 'openAddCardModal', 'openAddModal', 'openCardEditor', 'openAddCard']) {
  js = injectAtFunctionStart(js, name, "\n  addSourceView = curView;");
}

if (!/function\s+rerenderCardSourceView\s*\(/.test(js)) {
  const helper = `\nfunction rerenderCardSourceView(){\n  const source = addSourceView || curView;\n  if (source === 'board' && typeof activeBoardId !== 'undefined' && activeBoardId) {\n    if (typeof renderBoard === 'function') renderBoard(activeBoardId);\n    if (typeof showView === 'function') showView('board');\n    return;\n  }\n  if (source === 'boards' && typeof activeFolderId !== 'undefined' && activeFolderId) {\n    if (typeof renderFolderBoards === 'function') renderFolderBoards(activeFolderId);\n    if (typeof showView === 'function') showView('boards');\n    return;\n  }\n  if (typeof renderFolders === 'function') renderFolders();\n  if (typeof renderRecent === 'function') renderRecent();\n  if (typeof showView === 'function') showView(source || 'home');\n}\n`;
  const saveRange = scanFunctionRange(js, 'saveCard');
  if (saveRange) js = js.slice(0, saveRange.start) + helper + '\n' + js.slice(saveRange.start);
  else js += helper;
}

js = patchFunctionBody(js, 'renderFolderBoards', body => {
  return body
    .replace(/\n\s*showView\(['"]boards['"]\);?/g, '')
    .replace(/\n\s*document\.getElementById\(['"]view-boards['"]\)\?\.classList\.add\(['"]active['"]\);?/g, '')
    .replace(/\n\s*document\.getElementById\(['"]view-boards['"]\)\.classList\.add\(['"]active['"]\);?/g, '');
});

js = patchFunctionBody(js, 'saveCard', body => {
  if (/rerenderCardSourceView\s*\(/.test(body)) return body;
  const patch = "\n  rerenderCardSourceView();\n  addSourceView = null;";
  const saveDataMatch = body.match(/\n\s*saveData\s*\(\s*\)\s*;?/);
  if (saveDataMatch && saveDataMatch.index !== undefined) {
    const insertAt = saveDataMatch.index + saveDataMatch[0].length;
    return body.slice(0, insertAt) + patch + body.slice(insertAt);
  }
  const closeMatch = body.match(/\n\s*close\w*Modal\s*\(/);
  if (closeMatch && closeMatch.index !== undefined) {
    return body.slice(0, closeMatch.index) + patch + body.slice(closeMatch.index);
  }
  return body + patch + '\n';
});

fs.writeFileSync(indexPath, html.trimEnd() + '\n');
fs.writeFileSync(cssPath, css.trimEnd() + '\n');
fs.writeFileSync(jsPath, js.trimEnd() + '\n');

console.log('Refactored index.html into index.html, style.css, and app.js.');

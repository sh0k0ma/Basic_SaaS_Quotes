// app.js — QuoteShare 全機能を 1 ファイルに集約
//   - Canvas 描画
//   - PNG ダウンロード
//   - UI イベント

// ============================================================
// Canvas: 名言画像を描画する (1080 x 1080)
// ============================================================
const SIZE = 1080;

const TEMPLATES = {
  minimal: { font: 'system-ui, sans-serif', weight: '500', quoteScale: 1.0 },
  serif:   { font: 'Georgia, "Times New Roman", serif', weight: '400', quoteScale: 1.05 },
  bold:    { font: 'system-ui, sans-serif', weight: '800', quoteScale: 1.1 },
};

function renderQuote(canvas, data) {
  const ctx = canvas.getContext('2d');
  const tpl = TEMPLATES[data.template] || TEMPLATES.minimal;

  // 背景
  ctx.fillStyle = data.bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 装飾フレーム
  ctx.strokeStyle = withAlpha(data.fg, 0.25);
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, SIZE - 120, SIZE - 120);

  // 引用符
  ctx.fillStyle = withAlpha(data.fg, 0.2);
  ctx.font = `700 280px ${tpl.font}`;
  ctx.textBaseline = 'top';
  ctx.fillText('\u201C', 120, 100);

  // 本文(折り返し + 自動フィット)
  ctx.fillStyle = data.fg;
  const baseFont = Math.round(64 * tpl.quoteScale);
  const fontSize = fitFontSize(ctx, data.text, {
    fontFamily: tpl.font,
    weight: tpl.weight,
    maxWidth: SIZE - 240,
    maxHeight: SIZE - 480,
    initial: baseFont,
    lineHeight: 1.4,
  });
  ctx.font = `${tpl.weight} ${fontSize}px ${tpl.font}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const lines = wrapText(ctx, data.text, SIZE - 240);
  const lineHeight = fontSize * 1.4;
  const totalHeight = lines.length * lineHeight;
  const startY = SIZE / 2 - totalHeight / 2 + lineHeight / 2 - 20;
  lines.forEach((line, i) => {
    ctx.fillText(line, SIZE / 2, startY + i * lineHeight);
  });

  // 著者
  if (data.author) {
    ctx.fillStyle = withAlpha(data.fg, 0.75);
    ctx.font = `500 36px ${tpl.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`— ${data.author}`, SIZE / 2, SIZE - 140);
  }

  // ブランド
  ctx.fillStyle = withAlpha(data.fg, 0.4);
  ctx.font = `600 22px ${tpl.font}`;
  ctx.fillText('QuoteShare', SIZE / 2, SIZE - 90);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas blob 化に失敗しました'));
    }, 'image/png');
  });
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  text.split(/\r?\n/).forEach((paragraph) => {
    if (!paragraph) { lines.push(''); return; }
    let current = '';
    for (const ch of paragraph) {
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  });
  return lines;
}

function fitFontSize(ctx, text, opts) {
  let size = opts.initial;
  while (size > 24) {
    ctx.font = `${opts.weight} ${size}px ${opts.fontFamily}`;
    const lines = wrapText(ctx, text, opts.maxWidth);
    const totalHeight = lines.length * size * opts.lineHeight;
    if (totalHeight <= opts.maxHeight) return size;
    size -= 4;
  }
  return size;
}

function withAlpha(hex, alpha) {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================
// Download: PNG ダウンロード
// ============================================================
async function downloadPng(canvas) {
  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, 'quote.png');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================
// UI: イベント
// ============================================================
const $ = (id) => document.getElementById(id);

const els = {
  canvas: $('preview-canvas'),
  text: $('input-text'),
  author: $('input-author'),
  template: $('input-template'),
  bg: $('input-bg'),
  fg: $('input-fg'),
  btnDownload: $('btn-download'),
  status: $('status'),
  form: $('editor-form'),
};

function readForm() {
  return {
    text: els.text.value.trim(),
    author: els.author.value.trim(),
    template: els.template.value,
    bg: els.bg.value,
    fg: els.fg.value,
  };
}

function render() {
  renderQuote(els.canvas, readForm());
}

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.style.color = isError ? '#b91c1c' : '';
  if (msg) {
    setTimeout(() => {
      if (els.status.textContent === msg) els.status.textContent = '';
    }, 4000);
  }
}

['input', 'change'].forEach((ev) => {
  els.form.addEventListener(ev, render);
});

els.form.addEventListener('submit', (e) => {
  e.preventDefault();
});

els.btnDownload.addEventListener('click', async () => {
  try {
    await downloadPng(els.canvas);
    setStatus('PNG をダウンロードしました');
  } catch (err) {
    setStatus(`ダウンロード失敗: ${err.message}`, true);
  }
});

render();

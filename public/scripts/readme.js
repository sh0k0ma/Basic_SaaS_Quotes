const root = document.documentElement;
const themeToggle = document.querySelector('#theme-toggle');
const progressBar = document.querySelector('#reading-progress-bar');
const searchInput = document.querySelector('#doc-search');
const searchResult = document.querySelector('#search-result');
const sections = Array.from(document.querySelectorAll('.doc-section'));
const tocLinks = Array.from(document.querySelectorAll('.toc a'));

function applyTheme(theme) {
  const isDark = theme === 'dark';
  root.classList.toggle('theme-dark', isDark);
  themeToggle.textContent = isDark ? 'Light' : 'Dark';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  drawPreviewCanvas();
}

const savedTheme = localStorage.getItem('quoteshare.docs.theme');
applyTheme(savedTheme || 'light');

themeToggle.addEventListener('click', () => {
  const nextTheme = root.classList.contains('theme-dark') ? 'light' : 'dark';
  localStorage.setItem('quoteshare.docs.theme', nextTheme);
  applyTheme(nextTheme);
});

function updateReadingProgress() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
  progressBar.style.width = `${progress * 100}%`;
}

window.addEventListener('scroll', updateReadingProgress, { passive: true });
window.addEventListener('resize', updateReadingProgress);
updateReadingProgress();

function setActiveLink(id) {
  tocLinks.forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActiveLink(visible.target.id);
  }, { rootMargin: '-22% 0px -62% 0px', threshold: [0.1, 0.25, 0.5] });

  sections.forEach((section) => observer.observe(section));
}

function updateSearch() {
  const query = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  sections.forEach((section) => {
    const haystack = section.textContent.toLowerCase();
    const isVisible = !query || haystack.includes(query);
    section.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  tocLinks.forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    link.hidden = Boolean(query && section && section.hidden);
  });

  searchResult.textContent = query
    ? `${visibleCount} セクションが一致`
    : `${sections.length} セクション`;
}

searchInput.addEventListener('input', updateSearch);
updateSearch();

document.querySelectorAll('.code-block').forEach((block) => {
  const pre = block.querySelector('pre');
  const button = document.createElement('button');
  button.className = 'copy-button';
  button.type = 'button';
  button.textContent = 'Copy';

  button.addEventListener('click', async () => {
    const text = pre.textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      button.textContent = 'Copied';
    }

    window.setTimeout(() => {
      button.textContent = 'Copy';
    }, 1400);
  });

  block.append(button);
});

function drawPreviewCanvas() {
  const canvas = document.querySelector('#doc-preview-canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  const isDark = root.classList.contains('theme-dark');
  const size = canvas.width;
  const background = isDark ? '#10201d' : '#f7fbfa';
  const ink = isDark ? '#effaf6' : '#10201d';
  const muted = isDark ? 'rgba(239, 250, 246, 0.64)' : 'rgba(16, 32, 29, 0.62)';
  const accent = isDark ? '#ff7b9c' : '#be3455';
  const teal = isDark ? '#3fb6a7' : '#0f766e';

  context.clearRect(0, 0, size, size);
  context.fillStyle = background;
  context.fillRect(0, 0, size, size);

  context.fillStyle = teal;
  context.fillRect(0, 0, size, 18);
  context.fillStyle = accent;
  context.fillRect(0, size - 18, size, 18);

  context.strokeStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,118,110,0.22)';
  context.lineWidth = 4;
  context.strokeRect(56, 56, size - 112, size - 112);

  context.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,118,110,0.09)';
  context.font = '800 170px Georgia, serif';
  context.fillText('“', 92, 152);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = ink;
  context.font = '700 48px system-ui, sans-serif';
  context.fillText('信じる道を', size / 2, 300);
  context.fillText('歩むことだ。', size / 2, 366);

  context.fillStyle = muted;
  context.font = '600 24px system-ui, sans-serif';
  context.fillText('匿名', size / 2, 470);

  context.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(16,32,29,0.45)';
  context.font = '700 18px system-ui, sans-serif';
  context.fillText('QuoteShare', size / 2, 612);
}

drawPreviewCanvas();
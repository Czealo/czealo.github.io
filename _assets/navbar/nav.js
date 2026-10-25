//Copyright (c) 2026 Czealo
(function() {
const cssPath = '/_assets/navbar/style.css';
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = cssPath;
document.head.appendChild(link);
const initStyle = document.createElement('style');
initStyle.textContent = `
.navbar, .cover, .navlist {display: none;}
`;
document.head.appendChild(initStyle);
const navbarHTML = `
<nav class="navbar">
<a href="/" class="标志"><span class="标志原文">Czealo States</span><span class="标志悬停" aria-hidden="true">Home →</span></a>
<div class="rg">
<div class="菜单按钮" id="menuBtn">≡</div>
</div>
</nav>
<div class="cover" id="cover"></div>
<div class="navlist" id="navlist">

<a href="/" class="大标志">
<h1>Czealo States</h1>
</a>

<div class="列表区">

<div class="list">
<a href="/"><img src="/_assets/icons/home.svg">首页</a>
<a href="/nav.html"><img src="/_assets/icons/bars.svg">导航</a>
</div>

<div class="sl"></div>

<div class="list">
<a href="/games/index.html" target="_blank"><img src="/_assets/icons/controller.svg">游戏</a>
<a href="/contrap/index.html" target="_blank"><img src="/_assets/icons/clover.svg">妙物</a>
<a href="/tools/index.html" target="_blank"><img src="/_assets/icons/spanner.svg">工具</a>
</div>

<div class="sl"></div>

<div class="list">
<a href="/settings/index.html" target="_blank"><img src="/_assets/icons/gear.svg">设置</a>
</div>

</div>
</div>
`;
document.body.insertAdjacentHTML('afterbegin', navbarHTML);
function highlightCurrent() {
const current = location.pathname;
document.querySelectorAll('.navlist a').forEach(function(a) {
const href = a.getAttribute('href');
if (!href) return;
const target = href.replace(/(?:index)?\.html$/, '').replace(/\/$/, '') || '/';
const page = current.replace(/(?:index)?\.html$/, '').replace(/\/$/, '') || '/';
if (page === target || (target !== '/' && page.startsWith(target + '/'))) {
a.classList.add('锁了');
}});}
function applyNavigationLogic() {
const menuBtn = document.getElementById('menuBtn');
const navlist = document.getElementById('navlist');
const cover = document.getElementById('cover');
if (!menuBtn || !navlist || !cover) return;
highlightCurrent();
function openMenu() {
navlist.classList.add('open');
cover.classList.add('show');
document.body.style.overflow = 'hidden';
}
function closeMenu() {
navlist.classList.remove('open');
cover.classList.remove('show');
document.body.style.overflow = '';
if (window.__updateFakeBar) window.__updateFakeBar();
}
menuBtn.addEventListener('click', function(e) {
e.stopPropagation();
navlist.classList.contains('open') ? closeMenu() : openMenu();
});
cover.addEventListener('click', closeMenu);
document.querySelectorAll('.navlist a').forEach(function(a) {
a.addEventListener('click', function(event) {
if (a.target === '_blank') {
event.preventDefault();
window.open(a.href, '_blank', 'noopener,noreferrer');
}
closeMenu();
});
});
document.addEventListener('keydown', function(e) {
if (e.key === 'Escape' && navlist.classList.contains('open')) {
closeMenu();
return;
}
if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) {
const tag = document.activeElement && document.activeElement.tagName;
if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable)) {
return;
}
e.preventDefault();
navlist.classList.contains('open') ? closeMenu() : openMenu();
return;
}
if (e.key === 'Home' && !e.ctrlKey && !e.metaKey && !e.altKey) {
const tag = document.activeElement && document.activeElement.tagName;
if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable)) {
return;
}
e.preventDefault();
window.location.href = '/';
return;
}
});
window.addEventListener('resize', function() {
if (window.innerWidth > 768 && navlist.classList.contains('open')) {
closeMenu();
}
});
document.addEventListener('click', function(e) {
if (navlist.classList.contains('open') && !navlist.contains(e.target) && e.target !== cover) {
closeMenu();
}});}
function updateNavbarBackground() {
const page = document.querySelector('.page');
const navbar = document.querySelector('.navbar');
if (!page || !navbar) return;
const rect = page.getBoundingClientRect();
const viewport = window.visualViewport;
const detectionY = viewport ? viewport.offsetTop + viewport.height / 2 : window.innerHeight / 2;
navbar.classList.toggle('over-page', rect.top <= detectionY && rect.bottom > detectionY);
}
function initFakeScrollbar() {
const bar = document.createElement('div');
bar.className = 'fake-bar';
document.body.appendChild(bar);
const doc = document.documentElement;
let barHeight = 0;
let maxTop = 0;
let maxScroll = 0;
function update() {
updateNavbarBackground();
const clientH = doc.clientHeight;
const scrollH = doc.scrollHeight;
const scrollT = window.scrollY || doc.scrollTop;
if (scrollH <= clientH) {
bar.style.display = 'none';
return;
}
bar.style.display = 'block';
const NAV_H = 60;
const trackH = clientH - NAV_H;
maxScroll = scrollH - clientH;
barHeight = Math.max((clientH / scrollH) * trackH, 40);
barHeight = Math.min(barHeight, trackH);
maxTop = trackH - barHeight;
bar.style.height = barHeight + 'px';
bar.style.top = (NAV_H + (scrollT / maxScroll) * maxTop) + 'px';
}
window.__updateFakeBar = update;
let scrollTimer;
window.addEventListener('scroll', function() {
update();
document.body.classList.add('is-scrolling');
clearTimeout(scrollTimer);
scrollTimer = setTimeout(function() {
document.body.classList.remove('is-scrolling');
}, 800);
}, { passive: true });
window.addEventListener('resize', update);
if (window.visualViewport) window.visualViewport.addEventListener('resize', update);
if (window.ResizeObserver) {
new ResizeObserver(update).observe(document.body);
}
let startY = 0;
let startScrollTop = 0;
bar.addEventListener('mousedown', function(e) {
e.preventDefault();
startY = e.clientY;
startScrollTop = window.scrollY || doc.scrollTop;
bar.classList.add('is-dragging');
document.addEventListener('mousemove', onMove);
document.addEventListener('mouseup', onUp);
});
function onMove(e) {
const delta = e.clientY - startY;
const scrollDelta = (delta / maxTop) * maxScroll;
window.scrollTo(0, startScrollTop + scrollDelta);
}
function onUp() {
bar.classList.remove('is-dragging');
document.removeEventListener('mousemove', onMove);
document.removeEventListener('mouseup', onUp);
}
update();
}
let inited = false;
function boot() {
if (inited) return;
inited = true;
if (initStyle.parentNode) initStyle.parentNode.removeChild(initStyle);
applyNavigationLogic();
initFakeScrollbar();
}
if (link.onload !== undefined) {
link.onload = boot;
} else {
link.onreadystatechange = function() {
if (link.readyState === 'loaded' || link.readyState === 'complete') {
boot();
}};}
setTimeout(boot, 3000);
})();
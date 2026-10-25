(function() {
// 设置页可关闭启动动画
if (localStorage.getItem('czealo_no_boot') === '1') return;
var isReturning = localStorage.getItem('czealo_visited');
var welcomeText = isReturning ? 'Welcome back, Cute Ones.' : 'Welcome, Cute Ones.';
localStorage.setItem('czealo_visited', 'true');
var bootHTML = `
<div class="boot-scr" id="boot-screen">
<div class="boot-logo">Czealo States</div>
<div class="boot-txt" id="boot-text">System initializing...</div>
<div class="boot-bar">
<div class="boot-bar-inner" id="boot-progress-bar"></div>
</div>
</div>
`;
var style = document.createElement('style');
style.textContent = `
.boot-scr {
  position: fixed;
  inset: 0;
  background: #fff;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: wait;
  transition: opacity 0.6s, visibility 0.6s;}
.boot-logo {
  font-size: 40px;
  color: #55aee8;
  font-weight: 700;
  letter-spacing: 6px;
  margin-bottom: 20px;
  position: relative;}
.boot-logo::after {
  content: "";
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 2px;
  background: #438bd0;
  animation: scanline 1.5s infinite linear;}
@keyframes scanline {
  0% { top: 0; opacity: 0; }
  50% { opacity: 1; }
  100% { top: 100%; opacity: 0; }}
.boot-txt {
  font-size: 14px;
  color: #88bce8;
  font-family: monospace;
  min-height: 20px;}
.boot-bar {
  width: 200px;
  height: 4px;
  background: #d8efff;
  margin-top: 15px;
  border-radius: 2px;
  overflow: hidden;}
.boot-bar-inner {
  height: 100%;
  width: 0;
  background: #55aee8;
  transition: width 0.2s;}
`;
document.head.appendChild(style);
document.body.insertAdjacentHTML('beforeend', bootHTML);
var bootScreen = document.getElementById('boot-screen');
var bootText = document.getElementById('boot-text');
var bootProgressBar = document.getElementById('boot-progress-bar');
function runBootSequence() {
bootProgressBar.style.width = '30%';
bootText.textContent = 'Connecting to Czealo network...';
setTimeout(function() {
bootProgressBar.style.width = '60%';
bootText.textContent = 'Processing your request, please wait...';
}, 300);
setTimeout(function() {
bootProgressBar.style.width = '100%';
bootText.textContent = welcomeText;
}, 600);
setTimeout(function() {
bootScreen.style.pointerEvents = 'none';
bootScreen.style.opacity = '0';
bootScreen.style.visibility = 'hidden';
setTimeout(function() { bootScreen.remove(); }, 400);
}, 1000);}
runBootSequence();
})();
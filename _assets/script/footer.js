//Copyright (c) 2026 Czealo
(function() {
if (document.querySelector('.footer')) return;
var footer = document.createElement('div');
footer.className = 'footer';
footer.innerHTML = `
<div class="copyr">
<p>Copyright © 2026-2077 Czealo<br>
Licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank">CC BY-NC 4.0</a>.</p>
</div>
<div class="copyr">
<p>SOME CONTENT ON THIS PAGE IS FAN-MADE AND NOT OFFICIAL.<br>
ALL RIGHTS BELONG TO THE ORIGINAL COPYRIGHT HOLDERS.</p>
</div>
`;
document.body.appendChild(footer);
})();
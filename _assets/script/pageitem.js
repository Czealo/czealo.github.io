//Copyright (c) 2026 Czealo
(function() {
var container = document.getElementById('app');
if (!container) return;

container.innerHTML = '<div class="loading">Loading...</div>';

fetch('./app.json')
.then(function(res) {
if (!res.ok) throw new Error('app.json 加载失败');
return res.json();
})
.then(function(data) {
var apps = data.apps || [];
container.classList.toggle('has-multiple-items', apps.length > 1);
var html = '';
apps.forEach(function(app) {
html += '<a href="' + app.link + '" target="_blank" class="shelf">' +
'<img src="' + app.cover + '" class="pfimg" alt="' + app.title + '">' +
'<div class="pf">' +
'<img src="' + app.icon + '" class="pficon">' +
'<div class="info">' +
'<h3>' + app.title + '</h3>' +
'<p>' + app.desc + '</p>' +
'</div>' +
'</div>' +
'</a>';
});
container.innerHTML = html;
})
.catch(function(err) {
container.innerHTML = '<p style="color:#999;">列表加载失败，请稍后再试</p>';
console.error('加载 app.json 失败:', err);
});
})();
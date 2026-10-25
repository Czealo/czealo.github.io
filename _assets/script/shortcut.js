//Home键返回根目录
if (e.key === 'Home' && !e.ctrlKey && !e.metaKey && !e.altKey) {
const tag = document.activeElement && document.activeElement.tagName;
if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable)) {
return;}
e.preventDefault();
window.location.href = '/';
return;}
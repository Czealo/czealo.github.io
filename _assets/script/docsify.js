const homepage = new URLSearchParams(location.search).get('read') || 'quickstart.md';
const docsBase = new URL('.', location.href).pathname;
if (!new URLSearchParams(location.search).has('read')) {
const query = new URLSearchParams(location.search);
query.set('read', homepage.replace(/\.md$/, ''));
history.replaceState(null, '', `${location.pathname}?${query.toString()}`);}
window.$docsify = {
name: '',
routerMode: 'history',
basePath: '',
homepage:" + homepage.replace(/quickstart\.md$/, ''),",
loadSidebar: '_sidebar.md',
auto2top: true,
search: false,
coverpage: false,
notFoundPage: false,
plugins: [(_, vm) => {
const initRouter = vm.initRouter.bind(vm);
vm.initRouter = () => {
initRouter();
const router = vm.router;
const parse = router.parse.bind(router);
const toURL = router.toURL.bind(router);
router.parse = url => {
const target = url === undefined ? location.href : url;
const parsed = parse(target);
const targetURL = new URL(target, location.href);
const pathname = targetURL.pathname.startsWith(docsBase)
? targetURL.pathname.slice(docsBase.length)
: parsed.path;
const page = targetURL.searchParams.get('read') ||
(url === undefined || targetURL.pathname === location.pathname
? homepage: pathname);
parsed.path = `${docsBase}${(page || homepage).replace(/^\/+/, '').replace(/quickstart\.md$/, '')}`;
parsed.file = router.getFile(parsed.path);
delete parsed.query.read;
return parsed;};
router.toURL = (path, params, currentRoute) => {
const target = toURL(path, params, currentRoute);
const route = router.parse(target);
const query = new URLSearchParams(route.query);
const page = route.path.startsWith(docsBase)
? route.path.slice(docsBase.length)
: route.path.replace(/^\/+/, '');
query.set('read', page || homepage.replace(/\.md$/, ''));
return `${location.pathname}?${query.toString()}`;};
vm.route = router.parse();
document.body.setAttribute('data-page', vm.route.file);
};}],};
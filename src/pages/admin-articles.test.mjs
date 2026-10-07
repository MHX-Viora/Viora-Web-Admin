import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const directory = path.dirname(fileURLToPath(import.meta.url));
const article = { id: 'article-1', userId: 'author-1', displayName: 'Tác giả', postType: 2, content: 'Tiêu đề bài báo', status: 1, createdAt: '2026-10-07T01:00:00Z', articleBlocks: [{ id: 'block-1', orderIndex: 0, type: 0, content: 'Nội dung đầy đủ' }] };

function harness({ scope = 'articles', empty = false, action = null } = {}) {
  const requests = [], queries = [], controls = [], navigations = [], invalidations = [];
  let mutationPromise;
  const overrides = {
    react: { ...React, useState: (() => { let index = 0; return initial => React.useState(index++ === 1 ? action : initial); })() },
    'react-router-dom': { useParams: () => ({ id: article.id }), useSearchParams: () => [new URLSearchParams('page=2&pageSize=10&postType=0&status=1&reported=true&keyword=kinh'), () => {}], useNavigate: () => to => navigations.push(to), Link: props => React.createElement('a', { href: props.to }, props.children) },
    '@tanstack/react-query': { useQuery: config => { queries.push(config); return { data: config.queryKey.length === 2 && typeof config.queryKey[1] === 'string' ? { ...article, media: [], hashtags: [] } : { items: empty ? [] : [article], total: 23 }, refetch: async () => {} }; }, useQueryClient: () => ({ invalidateQueries: async config => invalidations.push(config.queryKey) }), useMutation: config => ({ isPending: false, mutate: value => { mutationPromise = Promise.resolve(config.mutationFn(value)).then(config.onSuccess); } }) },
    sonner: { toast: { success: () => {}, error: () => {} } },
    './http': { apiClient: Object.fromEntries(['get', 'patch', 'delete'].map(method => [method, async (url, options) => { requests.push({ method, url, options }); return { data: { items: [article], total: 23, ...article } }; }])), normalizePageResult: value => value, unwrapApiData: value => value },
    '../services/http': { getErrorMessage: () => 'Lỗi tải dữ liệu' },
  };
  const cache = new Map();
  function compile(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = new Module(file); cache.set(file, module);
    module.paths = Module._nodeModulePaths(path.dirname(file));
    module.require = name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name === 'react/jsx-runtime') {
        const runtime = require(name);
        const capture = factory => (type, props, key) => { if (['button', 'tr', 'article'].includes(type)) controls.push(props); return factory(type, props, key); };
        return { ...runtime, jsx: capture(runtime.jsx), jsxs: capture(runtime.jsxs) };
      }
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(file), name);
        const candidate = [base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(existsSync);
        if (candidate) return compile(candidate);
      }
      return require(name);
    };
    module._compile(ts.transpileModule(readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
    return module.exports;
  }
  function render(name) {
    const component = compile(path.join(directory, name + '.tsx'))[name];
    return renderToStaticMarkup(React.createElement(component, { scope }));
  }
  return { render, service: compile(path.join(directory, '../services/admin-post.service.ts')), queries, requests, controls, navigations, invalidations, get mutationPromise() { return mutationPromise; } };
}

test('Article API preserves server pagination, filters and article blocks', async () => {
  const h = harness();
  const params = { page: 2, pageSize: 10, status: '1', reported: 'true', keyword: 'kinh' };
  const page = await h.service.getAdminPosts(params, 'articles');
  const detail = await h.service.getAdminPost(article.id, 'articles');
  assert.equal(h.requests[0].url, '/api/admin/articles');
  assert.deepEqual(h.requests[0].options.params, params);
  assert.equal(page.total, 23);
  assert.deepEqual(detail.articleBlocks, article.articleBlocks);
  assert.equal(h.requests[1].url, '/api/admin/articles/article-1');
});
test('Every article moderation action uses the dedicated endpoint; posts keep their endpoint', async () => {
  const h = harness();
  for (const action of ['hide', 'restore', 'delete']) await h.service.moderateAdminPost(article.id, action, 'articles');
  await h.service.getAdminPosts({ page: 1, pageSize: 20 });
  assert.deepEqual(h.requests.map(({ method, url }) => [method, url]), [['patch', '/api/admin/articles/article-1/hide'], ['patch', '/api/admin/articles/article-1/restore'], ['delete', '/api/admin/articles/article-1'], ['get', '/api/admin/posts']]);
});
test('Article list ignores obsolete type filters and opens article details on desktop and mobile', async () => {
  const h = harness();
  const markup = h.render('PostsPage');
  assert.match(markup, /Quản lý bài báo/);
  assert.match(markup, /Tổng cộng 23 bài báo/);
  assert.match(markup, />Bài báo</);
  assert.doesNotMatch(markup, /<span>Loại<\/span>/);
  assert.doesNotMatch(markup, /bài viết/);
  assert.equal(h.queries[0].queryKey[0], 'articles');
  await h.queries[0].queryFn();
  assert.equal(h.requests[0].url, '/api/admin/articles');
  assert.equal(h.requests[0].options.params.page, 2);
  for (const control of h.controls.filter(control => control.onClick && ['mobile-user-card', undefined].includes(control.className))) control.onClick();
  assert.ok(h.navigations.length >= 2);
  assert.ok(h.navigations.every(to => to === '/articles/article-1'));
});
test('Article detail shows blocks, links back to articles and invalidates its own list after moderation', async () => {
  const h = harness({ action: 'hide' });
  const markup = h.render('PostDetailPage');
  assert.match(markup, /Chi tiết bài báo/);
  assert.match(markup, /Nội dung đầy đủ/);
  assert.match(markup, /href="\/articles"/);
  const confirm = h.controls.find(control => Array.isArray(control.children) && control.children.includes('Đồng ý'));
  assert.ok(confirm);
  confirm.onClick(); await h.mutationPromise;
  assert.equal(h.requests[0].url, '/api/admin/articles/article-1/hide');
  assert.ok(h.invalidations.some(key => key[0] === 'articles'));
  assert.ok(!h.invalidations.some(key => key[0] === 'posts'));
});
test('Empty articles and ordinary posts retain distinct labels and cache keys', () => {
  assert.match(harness({ empty: true }).render('PostsPage'), /Không có bài báo/);
  const posts = harness({ scope: 'posts' });
  assert.match(posts.render('PostsPage'), /Quản lý bài viết/);
  assert.equal(posts.queries[0].queryKey[0], 'posts');
});

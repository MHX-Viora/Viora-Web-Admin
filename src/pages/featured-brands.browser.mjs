import assert from 'node:assert/strict';
import { build } from '../../../viora/node_modules/esbuild/lib/main.js';
import { openDocsBrowser } from '../../../viora/features/developer/docs/tests/browser-fixture.mjs';
import { createServer } from 'node:http';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
const imagePath = path.resolve('.codex-tmp/admin-upload.png');
await mkdir(path.dirname(imagePath), { recursive: true });
await writeFile(imagePath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64'));
let uploadCount = 0;

const result = await build({ stdin: { contents: `
  import React from 'react';import {createRoot} from 'react-dom/client';
  import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {Toaster} from 'sonner';
  import {FeaturedBrandsPage} from './src/pages/FeaturedBrandsPage';
  import './src/index.css';import './src/enterprise.css';import './src/ankt-admin.css';
  createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><main style={{padding:24}}><FeaturedBrandsPage/></main><Toaster/></QueryClientProvider>);
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, jsx: 'automatic', write: false,
  outdir: path.resolve('.codex-tmp/brand-admin'), loader: { '.png': 'file', '.svg': 'file' },
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
});
const files = new Map(result.outputFiles.map(file => ['/' + path.basename(file.path), file.contents]));
let items = [], sequence = 0;
const calls = [];
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local.test');
  if (url.pathname === '/api/admin/images') {
    let raw = Buffer.alloc(0); for await (const chunk of req) raw = Buffer.concat([raw, chunk]);
    assert.ok(req.headers['content-type'].includes('multipart/form-data'));
    assert.ok(raw.includes(Buffer.from('admin-upload.png')));
    uploadCount++;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ url: 'https://images.example.test/' + (uploadCount > 1 ? 'updated.webp' : 'logo.webp') })); return;
  }
  if (url.pathname.startsWith('/api/admin/featured-brands')) {
    calls.push(req.method); res.setHeader('Content-Type', 'application/json');
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    if (req.method === 'GET') { res.end(JSON.stringify(items)); return; }
    if (req.method === 'POST') { const item = { ...body, id: 'brand-' + ++sequence, version: 1 }; items.push(item); res.end(JSON.stringify(item)); return; }
    const item = items.find(item => item.id === url.pathname.split('/').at(-1));
    if (!item) { res.statusCode = 404; res.end('{}'); return; }
    const version = req.method === 'DELETE' ? Number(url.searchParams.get('version')) : body.version;
    if (item.version !== version) { res.statusCode = 409; res.end(JSON.stringify({ error: { message: 'Banner đã thay đổi.' } })); return; }
    if (req.method === 'PUT') { Object.assign(item, body, { version: item.version + 1 }); res.end(JSON.stringify(item)); return; }
    if (req.method === 'DELETE') { items = items.filter(value => value.id !== item.id); res.statusCode = 204; res.end(); return; }
  }
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/stdin.css"><div id="root"></div><script src="/stdin.js"></script>'); return; }
  res.setHeader('Content-Type', req.url.endsWith('.css') ? 'text/css' : 'text/javascript'); res.end(files.get(req.url));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await openDocsBrowser();
  await browser.rpc('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  await browser.wait('document.body.textContent.includes("Chưa có thương hiệu")');
  const clickText = async text => {
    const index = await browser.read(`Array.from(document.querySelectorAll('button')).findIndex(e=>e.textContent===${JSON.stringify(text)})`);
    assert.ok(index >= 0, text);
    const point = await browser.read(`(()=>{const e=Array.from(document.querySelectorAll('button'))[${index}];e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await browser.rpc('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await browser.rpc('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  };
  const chooseImage = async () => {
    const { root } = await browser.rpc('DOM.getDocument');
    const { nodeId } = await browser.rpc('DOM.querySelector', { nodeId: root.nodeId, selector: 'form input[type=file]' });
    await browser.rpc('DOM.setFileInputFiles', { nodeId, files: [imagePath] });
    await browser.wait('!!document.querySelector(".image-file-field img")?.src.startsWith("blob:")');
  };
  await clickText('Thêm thương hiệu');
  await browser.click('form input[maxlength="160"]'); await browser.rpc('Input.insertText', { text: 'Sample brand' });
  await chooseImage();
  await clickText('Lưu thương hiệu');
  await browser.wait('document.querySelectorAll(".featured-brand-list article").length===1');
  assert.equal(items[0].isActive, false);
  await clickText('Bật'); await browser.wait('document.querySelector(".featured-brand-list").textContent.includes("Đang bật")');
  assert.equal(items[0].isActive, true);
  await clickText('Sửa'); await browser.click('form input[maxlength="160"]'); await browser.key('a', 2); await browser.rpc('Input.insertText', { text: 'Updated brand' });
  await clickText('Lưu thương hiệu'); await browser.wait('document.querySelector(".featured-brand-list h2").textContent==="Updated brand"');
  for (const width of [1440, 375]) {
    await browser.rpc('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  }
  await clickText('Xóa'); await browser.wait('!!document.querySelector("[role=dialog]")');
  await browser.key('Escape'); await browser.wait('!document.querySelector("[role=dialog]")'); assert.equal(items.length, 1);
  await clickText('Xóa'); await clickText('Xóa thương hiệu'); await browser.wait('document.body.textContent.includes("Chưa có thương hiệu")');
  assert.deepEqual(calls.filter(method => method !== 'GET'), ['POST', 'PUT', 'PUT', 'DELETE']);
  assert.equal(uploadCount, 1);
  assert.deepEqual(browser.issues, []);
  console.log('PASS admin brand page: create, preview/form, activate, edit, responsive bounds, cancel and confirm delete.');
} catch (error) {
  console.error({ calls, issues: browser?.issues, form: browser ? await browser.read(`Array.from(document.querySelectorAll('form input')).map(e=>({type:e.type,value:e.value,valid:e.validity.valid,message:e.validationMessage}))`) : null });
  throw error;
} finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }

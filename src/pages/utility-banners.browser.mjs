import assert from 'node:assert/strict';
import { build } from '../../../viora/node_modules/esbuild/lib/main.js';
import { openDocsBrowser } from '../../../viora/features/developer/docs/tests/browser-fixture.mjs';
import { createServer } from 'node:http';
import path from 'node:path';

const result = await build({ stdin: { contents: `
  import React from 'react';import {createRoot} from 'react-dom/client';
  import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {Toaster} from 'sonner';
  import {UtilityBannersPage} from './src/pages/UtilityBannersPage';
  import './src/index.css';import './src/enterprise.css';import './src/ankt-admin.css';
  createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><main style={{padding:24}}><UtilityBannersPage/></main><Toaster/></QueryClientProvider>);
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, jsx: 'automatic', write: false,
  outdir: path.resolve('.codex-tmp/banner-admin'), loader: { '.png': 'file', '.svg': 'file' },
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
});
const files = new Map(result.outputFiles.map(file => ['/' + path.basename(file.path), file.contents]));
let items = [], sequence = 0;
const calls = [];
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local.test');
  if (url.pathname.startsWith('/api/admin/utility-banners')) {
    calls.push(req.method); res.setHeader('Content-Type', 'application/json');
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    if (req.method === 'GET') { res.end(JSON.stringify(items)); return; }
    if (req.method === 'POST') { const item = { ...body, id: 'banner-' + ++sequence, version: 1 }; items.push(item); res.end(JSON.stringify(item)); return; }
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
  await browser.wait('document.body.textContent.includes("Chưa có banner")');
  const clickText = async text => {
    const index = await browser.read(`Array.from(document.querySelectorAll('button')).findIndex(e=>e.textContent===${JSON.stringify(text)})`);
    assert.ok(index >= 0, text);
    const point = await browser.read(`(()=>{const e=Array.from(document.querySelectorAll('button'))[${index}];e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await browser.rpc('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await browser.rpc('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  };
  await clickText('Thêm banner');
  await browser.click('form input[maxlength="160"]'); await browser.rpc('Input.insertText', { text: 'Summer banner' });
  await browser.click('form input[type=url]'); await browser.rpc('Input.insertText', { text: 'https://images.example.test/banner.webp' });
  await clickText('Lưu banner');
  await browser.wait('document.querySelectorAll(".utility-banner-list article").length===1');
  assert.equal(items[0].isActive, false);
  await clickText('Bật'); await browser.wait('document.querySelector(".utility-banner-list").textContent.includes("Đang bật")');
  assert.equal(items[0].isActive, true);
  await clickText('Sửa'); await browser.click('form input[maxlength="160"]'); await browser.key('a', 2); await browser.rpc('Input.insertText', { text: 'Updated banner' });
  await clickText('Lưu banner'); await browser.wait('document.querySelector(".utility-banner-list h2").textContent==="Updated banner"');
  for (const width of [1440, 375]) {
    await browser.rpc('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  }
  await clickText('Xóa'); await browser.wait('!!document.querySelector("[role=dialog]")');
  await browser.key('Escape'); await browser.wait('!document.querySelector("[role=dialog]")'); assert.equal(items.length, 1);
  await clickText('Xóa'); await clickText('Xóa banner'); await browser.wait('document.body.textContent.includes("Chưa có banner")');
  assert.deepEqual(calls.filter(method => method !== 'GET'), ['POST', 'PUT', 'PUT', 'DELETE']);
  assert.deepEqual(browser.issues, []);
  console.log('PASS admin banner page: create, preview/form, activate, edit, responsive bounds, cancel and confirm delete.');
} catch (error) {
  console.error({ calls, issues: browser?.issues, form: browser ? await browser.read(`Array.from(document.querySelectorAll('form input')).map(e=>({type:e.type,value:e.value,valid:e.validity.valid,message:e.validationMessage}))`) : null });
  throw error;
} finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }

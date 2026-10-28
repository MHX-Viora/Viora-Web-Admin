import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from '../../../viora/node_modules/esbuild/lib/main.js';
import { openDocsBrowser } from '../../../viora/features/developer/docs/tests/browser-fixture.mjs';

const directory = path.resolve('.codex-tmp/image-files');
await mkdir(directory, { recursive: true });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');
await writeFile(path.join(directory, 'image.png'), png);
await writeFile(path.join(directory, 'invalid.svg'), '<svg/>');
const result = await build({ stdin: { contents: `
  import React from 'react'; import {createRoot} from 'react-dom/client';
  import {QueryClient,QueryClientProvider} from '@tanstack/react-query'; import {Toaster} from 'sonner';
  import {NotificationsPage} from './src/pages/MetaPages'; import {StickerPacksPage} from './src/pages/StickerPacksPage';
  import './src/index.css'; import './src/enterprise.css'; import './src/ankt-admin.css';
  createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><main style={{padding:24}}>{location.pathname==='/stickers'?<StickerPacksPage/>:<NotificationsPage/>}</main><Toaster/></QueryClientProvider>);
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, jsx: 'automatic', outdir: directory,
  loader: { '.svg': 'file', '.png': 'file' }, define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' } });
const assets = new Map(result.outputFiles.map(file => ['/' + path.basename(file.path), file.contents]));
const pack = { id: 'pack-1', name: 'Test pack', thumbnailUrl: 'https://images.example.test/pack.png', price: 0,
  isFeatured: false, isActive: true, availableFrom: null, availableUntil: null, stickerCount: 0, ownerCount: 0, usageCount: 0, createdAt: new Date().toISOString() };
const announcements = [], stickers = [];
let uploadCount = 0, failUpload = true;
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://fixture.test').pathname;
  res.setHeader('Cache-Control', 'no-store');
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    if (pathname === '/api/admin/images' || pathname.endsWith('/upload')) {
      uploadCount++;
      assert.ok(req.headers['content-type'].includes('multipart/form-data'));
      assert.ok(bytes.includes(png));
      if (failUpload) { res.statusCode = 503; res.end(JSON.stringify({ error: { message: 'Upload test failure' } })); return; }
      res.end(JSON.stringify({ url: 'https://images.example.test/chosen.png' })); return;
    }
    if (pathname === '/api/admin/announcements') { announcements.push(JSON.parse(bytes)); res.end('{}'); return; }
    if (pathname === '/api/admin/sticker-packs') { res.end(JSON.stringify([pack])); return; }
    if (pathname.endsWith('/stickers')) {
      const sticker = { id: 'sticker-1', ...JSON.parse(bytes) }; stickers.push(sticker); res.end(JSON.stringify(sticker)); return;
    }
    if (pathname === '/api/admin/sticker-packs/pack-1') { res.end(JSON.stringify({ pack, stickers })); return; }
    res.statusCode = 404; res.end('{}'); return;
  }
  if (assets.has(pathname)) { res.setHeader('Content-Type', pathname.endsWith('.css') ? 'text/css' : 'text/javascript'); res.end(assets.get(pathname)); return; }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/stdin.css"><div id="root"></div><script src="/stdin.js"></script></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await openDocsBrowser();
  const originalClick = browser.click;
  browser.click = async selector => {
    await browser.read(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center',behavior:'instant'})`);
    await originalClick(selector);
  };
  const origin = `http://127.0.0.1:${server.address().port}`;
  // Observe object URL cleanup, with synthetic data only.
  await browser.rpc('Page.addScriptToEvaluateOnNewDocument', { source: `window.confirm=()=>true;window.released=[];const release=URL.revokeObjectURL;URL.revokeObjectURL=function(url){window.released.push(url);release.call(URL,url)}` });
  const file = async (selector, name = 'image.png') => {
    const { root } = await browser.rpc('DOM.getDocument');
    const { nodeId } = await browser.rpc('DOM.querySelector', { nodeId: root.nodeId, selector });
    assert.ok(nodeId, selector);
    await browser.rpc('DOM.setFileInputFiles', { nodeId, files: [path.join(directory, name)] });
  };
  const type = async (selector, value) => { await browser.click(selector); await browser.rpc('Input.insertText', { text: value }); };
  await browser.rpc('Page.navigate', { url: origin + '/notifications' });
  await browser.wait('!!document.querySelector("input[type=file]")');
  await type('form input:not([type=file])', 'Test title'); await type('textarea', 'Test body');
  await browser.click('button[type=submit]');
  await browser.wait('document.body.textContent.includes("Đã gửi thông báo")');
  assert.equal(announcements.length, 1); assert.equal(announcements[0].imageUrl, undefined);
  await file('input[type=file]', 'invalid.svg');
  await browser.wait('!!document.querySelector(".image-file-field [role=alert]")'); assert.equal(uploadCount, 0);
  await file('input[type=file]');
  await browser.wait('!!document.querySelector(".image-file-field img")?.src.startsWith("blob:")');
  for (const width of [375, 1440]) {
    await browser.rpc('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await browser.wait('document.documentElement.scrollWidth<=innerWidth');
    await browser.click('.image-file-field label');
    const shot = await browser.rpc('Page.captureScreenshot', { format: 'png' });
    await writeFile(path.join(directory, `notification-${width}.png`), Buffer.from(shot.data, 'base64'));
  }
  await browser.click('button[type=submit]');
  await browser.wait('document.body.textContent.includes("Upload test failure")');
  assert.equal(announcements.length, 1);
  assert.equal(await browser.read('!!document.querySelector(".image-file-field img")?.src.startsWith("blob:")'), true);
  failUpload = false;
  await browser.click('button[type=submit]');
  for (let attempt = 0; announcements.length < 2 && attempt < 100; attempt++) await new Promise(resolve => setTimeout(resolve, 25));
  await browser.wait('!document.querySelector("button[type=submit]").disabled');
  assert.equal(announcements.length, 2); assert.equal(announcements[1].imageUrl, 'https://images.example.test/chosen.png');
  await browser.click('.image-file-field button');
  await browser.wait('window.released.length===1 && !document.querySelector(".image-file-field img")');
  for (const width of [375, 1440]) {
    await browser.rpc('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  }
  await browser.rpc('Page.navigate', { url: origin + '/stickers' });
  await browser.wait('!!document.querySelector("tbody tr")'); await browser.click('tbody tr');
  await browser.wait('!!document.querySelector(".sticker-upload-row input[type=file]")');
  assert.equal(await browser.read(`!!document.querySelector('input[placeholder="Image URL"]')`), false);
  await type('.sticker-upload-row input:not([type=file])', 'Sticker test');
  assert.equal(await browser.read('document.querySelector(".sticker-upload-row button.primary").disabled'), true);
  await file('.sticker-upload-row input[type=file]');
  await browser.wait('!!document.querySelector(".sticker-upload-row img")?.src.startsWith("blob:")');
  await browser.click('.sticker-upload-row button.primary');
  await browser.wait('document.querySelectorAll(".sticker-admin-list article").length===1');
  assert.equal(stickers[0].name, 'Sticker test'); assert.equal(stickers[0].format, 0);
  assert.equal(stickers[0].imageUrl, 'https://images.example.test/chosen.png');
  await browser.wait('window.released.length===1');
  assert.deepEqual(browser.issues, []);
  console.log('PASS notification optional image, invalid file, upload failure/retry, preview removal/URL cleanup, responsive; sticker upload/create.');
} catch (error) {
  console.error({ uploadCount, announcements: announcements.length, stickers: stickers.length, issues: browser?.issues,
    state: browser ? await browser.read('({text:document.body.innerText,inputs:[...document.querySelectorAll("input,textarea")].map(e=>({type:e.type,value:e.value,valid:e.validity.valid}))})') : null });
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}

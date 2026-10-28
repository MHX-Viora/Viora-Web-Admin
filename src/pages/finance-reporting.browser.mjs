import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from '../../../viora/node_modules/esbuild/lib/main.js';
import { openDocsBrowser } from '../../../viora/features/developer/docs/tests/browser-fixture.mjs';

const output = await build({ stdin: { contents: `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter,Routes,Route} from 'react-router-dom'; import {Toaster} from 'sonner';
import {FinancePage} from './src/pages/FinancePage'; import {WithdrawalDetailPage} from './src/pages/WithdrawalDetailPage';
import './src/index.css'; import './src/enterprise.css'; import './src/ankt-admin.css'; import './src/finance.css';
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><BrowserRouter><main style={{padding:24,maxWidth:1440,margin:'auto',minWidth:0}}><Routes><Route path="/finance" element={<FinancePage/>}/><Route path="/finance/withdrawals/:id" element={<WithdrawalDetailPage/>}/><Route path="*" element={<FinancePage/>}/></Routes></main><Toaster/></BrowserRouter></QueryClientProvider>);
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, jsx: 'automatic', write: false, outdir: '.codex-tmp/finance-browser', define: { 'import.meta.env.VITE_API_BASE_URL': '""', 'process.env.NODE_ENV': '"development"' }, loader: { '.png': 'dataurl', '.svg': 'dataurl' } });
const assets = new Map(output.outputFiles.map(x => ['/' + path.basename(x.path), x.contents]));
const requests = [];
let failOverview = false;
let emptyRevenue = false;
const userId = '10000000-0000-0000-0000-000000000001';
const withdrawalId = '20000000-0000-0000-0000-000000000001';
const adId = '30000000-0000-0000-0000-000000000001';
const page = data => ({ data, page: 1, pageSize: 20, totalItems: data.length, totalPages: data.length ? 1 : 0 });
const withdrawal = { id: withdrawalId, userId, displayName: 'Nguyễn Minh Anh', transactionCode: 'ANKT28100001', amount: 100000, fee: 10000, feePercent: 10, netAmount: 90000, currency: 'VND', status: 0, bankAccountId: 'bank-fixture', bankCode: 'VCB', bankName: 'Vietcombank', bankAccountMasked: '•••• 7890', bankAccountHolderName: 'NGUYEN MINH ANH', failureReason: null, createdAt: '2026-10-28T02:00:00Z', updatedAt: '2026-10-28T02:00:00Z', processingAt: null, completedAt: null };
const daily = [{ date: '2026-10-27', advertisingRevenue: 230000, withdrawalFeeRevenue: 10000, totalRevenue: 240000 }, { date: '2026-10-28', advertisingRevenue: 120000, withdrawalFeeRevenue: 20000, totalRevenue: 140000 }];
const revenues = [{ id: adId, source: 'advertising', userId, displayName: withdrawal.displayName, amount: 120000, occurredAt: '2026-10-28T02:00:00Z', referenceType: 'AdvertisementEvent', referenceId: 'campaign-fixture', description: 'Chi phí quảng cáo đã sử dụng' }, { id: withdrawalId, source: 'withdrawal_fee', userId, displayName: withdrawal.displayName, amount: 10000, occurredAt: '2026-10-27T02:00:00Z', referenceType: 'Withdrawal', referenceId: withdrawalId, description: 'ANKT27100001' }];
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://finance.test');
  if (url.pathname.startsWith('/api/')) {
    requests.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), method: req.method });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const send = data => res.end(JSON.stringify(data));
    if (url.pathname.endsWith('/overview')) {
      if (failOverview) { res.statusCode = 503; return send({ error: { message: 'Không tải được báo cáo thử nghiệm' } }); }
      return send({ from: url.searchParams.get('from'), to: url.searchParams.get('to'), timeZone: 'Asia/Ho_Chi_Minh', generatedAt: '2026-10-28T03:00:00Z', depositedAmount: 5000000, withdrawnNetAmount: 900000, advertisingRevenue: 350000, withdrawalFeeRevenue: 30000, totalRevenue: 380000, availableBalance: 3200000, heldBalance: 600000, pendingWithdrawals: 1, processingWithdrawals: 0, outstandingWithdrawalAmount: 100000, daily });
    }
    if (url.pathname.endsWith('/revenue/export')) { res.setHeader('Content-Type', 'text/csv'); return res.end('\ufeffNguon,So tien\r\nadvertising,120000'); }
    if (url.pathname.endsWith('/revenue')) return send(page(emptyRevenue ? [] : revenues.filter(x => !url.searchParams.get('source') || x.source === url.searchParams.get('source'))));
    if (url.pathname.endsWith('/reconciliation')) return send(page([{ code: 'PAID_DEPOSIT_UNCREDITED', id: adId, userId, displayName: withdrawal.displayName, referenceType: 'Payment', referenceId: adId, expectedAmount: 100000, actualAmount: 0, detectedAt: '2026-10-28T03:00:00Z' }]));
    if (url.pathname.endsWith('/withdrawal-fee-settings')) return send({ feePercent: 10, version: 1, updatedAt: '2026-10-28T02:00:00Z', updatedBy: null });
    if (url.pathname.endsWith('/withdrawals')) return send(page([withdrawal].filter(x => !url.searchParams.has('status') || String(x.status) === url.searchParams.get('status'))));
    if (url.pathname.includes('/withdrawals/')) return send({ withdrawal, userId, displayName: withdrawal.displayName, accountNumber: '001234567890', canTransfer: true, qrImageUrl: null, timeline: [{ status: 0, at: withdrawal.createdAt, actorId: userId, actorName: withdrawal.displayName, reason: null }] });
    if (url.pathname.endsWith('/transactions')) return send(page([{ id: adId, walletId: 'wallet-fixture', userId, displayName: withdrawal.displayName, type: 9, amount: -120000, status: 1, referenceType: 'AdvertisementEvent', referenceId: 'campaign-fixture', description: 'Chi quảng cáo', createdAt: '2026-10-28T02:00:00Z', balanceBefore: 500000, balanceAfter: 500000, heldBefore: 220000, heldAfter: 100000, coinAmount: null }]));
    if (url.pathname.endsWith('/payments')) return send(page([]));
    if (url.pathname.endsWith('/wallets')) return send(page([]));
    res.statusCode = 404; return send({});
  }
  if (assets.has(url.pathname)) { res.setHeader('Content-Type', url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript'); return res.end(assets.get(url.pathname)); }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<!doctype html><html lang="vi"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/stdin.css"><div id="root"></div><script src="/stdin.js"></script></html>');
});
await new Promise(resolve => server.listen(process.argv.includes('--serve') ? 4326 : 0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
if (process.argv.includes('--serve')) console.log(`Finance fixture: ${base}/finance`);
else {
  let browser;
  try {
    browser = await openDocsBrowser();
    const navigate = async query => browser.rpc('Page.navigate', { url: base + '/finance' + query });
    const clickText = async text => {
      const point = await browser.read(`(()=>{const e=Array.from(document.querySelectorAll('button,a')).find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('Missing control');e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      await browser.rpc('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
      await browser.rpc('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    };
    await navigate('?from=2026-10-01&to=2026-10-28');
    await browser.wait('document.body.textContent.includes("380.000")');
    assert.equal(await browser.read('document.querySelectorAll(".finance-primary-tabs a").length'), 7);
    assert.equal(await browser.read('document.body.textContent.includes("quà Live")'), false);
    await clickText('1 yêu cầu chờ duyệt →');
    await browser.wait('document.body.textContent.includes("ANKT28100001")');
    assert.ok(requests.some(x => x.path.endsWith('/withdrawals') && x.query.status === '0'));
    await clickText('Xem chi tiết');
    await browser.wait('document.body.textContent.includes("001234567890")');
    assert.equal(await browser.read('document.querySelector(".withdrawal-hero h2").textContent'), '90.000 ₫');
    await navigate('?tab=revenue&from=2026-10-01&to=2026-10-28&source=withdrawal_fee');
    await browser.wait('document.body.textContent.includes("ANKT27100001")');
    assert.equal(await browser.read('document.querySelectorAll(".finance-report-panel:last-child tbody tr").length'), 1);
    await clickText('Xuất CSV');
    await browser.wait('!Array.from(document.querySelectorAll("button")).some(x=>x.textContent.includes("Đang xuất"))');
    assert.ok(requests.some(x => x.path.endsWith('/revenue/export') && x.query.source === 'withdrawal_fee' && x.query.from === '2026-10-01'));
    for (const width of [1440, 768, 375]) {
      await browser.rpc('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await browser.wait('document.documentElement.scrollWidth<=innerWidth');
    }
    await navigate('?tab=reconciliation');
    await browser.wait('document.body.textContent.includes("1 điểm cần kiểm tra")');
    await clickText('Mở dữ liệu liên quan');
    await browser.wait(`location.search.includes('tab=payments') && !!document.querySelector('input[aria-label="Tìm tài chính"]')`);
    assert.equal(await browser.read(`document.querySelector('input[aria-label="Tìm tài chính"]').value`), adId);
    await navigate('?tab=transactions&from=2026-10-01&to=2026-10-28&type=9&status=1');
    await browser.wait('document.body.textContent.includes("Chi quảng cáo")');
    assert.ok(requests.some(x => x.path.endsWith('/transactions') && x.query.type === '9' && x.query.status === '1' && x.query.to === '2026-10-28'));
    const count = requests.filter(x => x.path.endsWith('/overview')).length;
    await navigate('?tab=overview&from=2026-11-01&to=2026-10-01');
    await browser.wait('!!document.querySelector("[role=alert]")');
    assert.equal(requests.filter(x => x.path.endsWith('/overview')).length, count);
    emptyRevenue = true;
    await navigate('?tab=revenue');
    await browser.wait('document.body.textContent.includes("Chưa có doanh thu phù hợp")');
    failOverview = true;
    await navigate('?tab=overview');
    await browser.wait('document.body.textContent.includes("Không tải được báo cáo thử nghiệm")');
    failOverview = false;
    await clickText('Thử lại');
    await browser.wait('document.body.textContent.includes("380.000")');
    await mkdir('.codex-tmp/finance-browser', { recursive: true });
    for (const width of [1440, 375]) {
      await browser.rpc('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      await browser.wait('document.documentElement.scrollWidth<=innerWidth');
      const shot = await browser.rpc('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      await writeFile(`.codex-tmp/finance-browser/overview-${width}.png`, Buffer.from(shot.data, 'base64'));
    }
    assert.deepEqual(browser.issues, []);
    console.log('Finance browser: navigation, source/date/status filters, withdrawal detail, CSV, reconciliation links, invalid/empty/error/retry states and 1440/768/375px layouts passed.');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}

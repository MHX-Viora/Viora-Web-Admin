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
const withdrawal = { id: 'request-fixture', userId: 'user-fixture', transactionCode: 'ANKTTEST123', amount: 500000, fee: 5000, netAmount: 495000, status: 1, bankCode: 'VCB', bankName: 'Vietcombank', bankAccountId: 'bank-fixture', bankAccountMasked: '•••• 7890', bankAccountHolderName: 'TEST USER', createdAt: '2026-10-06T01:00:00Z', updatedAt: '2026-10-06T01:00:00Z' };
const detail = { withdrawal, userId: 'user-fixture', displayName: 'Người yêu cầu', canTransfer: true, accountNumber: '001234567890', qrImageUrl: 'https://img.vietqr.io/image/970436-001234567890-compact2.png?amount=495000&addInfo=ANKTTEST123', timeline: [{ status: 0, at: withdrawal.createdAt, actorId: 'user-fixture', reason: null }] };
function render({ qrFailure = false, value = detail, loading = false, error = false } = {}) {
  const controls = [];
  const overrides = {
    react: { ...React, useState: (() => { let index = 0; return initial => { const current = index++; return React.useState(current === 2 && qrFailure ? value.qrImageUrl : initial); }; })() },
    'react-router-dom': { useParams: () => ({ id: 'request-fixture' }), Link: props => React.createElement('a', { href: props.to }, props.children) },
    '@tanstack/react-query': { useQuery: () => ({ data: value, isLoading: loading, isError: error, refetch: async () => {} }), useQueryClient: () => ({ invalidateQueries: async () => {} }), useMutation: () => ({ isPending: false, mutate: () => {} }) },
    'sonner': { toast: { success: () => {}, error: () => {} } },
    '../services/http': { getErrorMessage: () => 'Không tải được dữ liệu' },
    './http': { apiClient: {} },
  };
  const cache = new Map();
  function compile(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = new Module(file); cache.set(file, module);
    module.paths = Module._nodeModulePaths(path.dirname(file));
    module.require = name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name === 'react/jsx-runtime') {
        const jsx = require(name);
        return { ...jsx, jsx: (type, props, key) => { if (type === 'button') controls.push(props); return jsx.jsx(type, props, key); }, jsxs: (type, props, key) => { if (type === 'button') controls.push(props); return jsx.jsxs(type, props, key); } };
      }
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(file), name);
        const candidate = [base + '.ts', base + '.tsx'].find(existsSync);
        if (candidate) return compile(candidate);
      }
      return require(name);
    };
    module._compile(ts.transpileModule(readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
    return module.exports;
  }
  const { WithdrawalDetailPage } = compile(path.join(directory, 'WithdrawalDetailPage.tsx'));
  return { markup: renderToStaticMarkup(React.createElement(WithdrawalDetailPage)), controls };
}
test('Transfer hero uses net amount and manual recipient details remain explicit', () => {
  const { markup } = render();
  assert.match(markup, /<h2>495\.000 ₫<\/h2>/);
  assert.match(markup, /001234567890/); assert.match(markup, /ANKTTEST123/);
  assert.match(markup, /amount=495000/); assert.match(markup, /Thông tin kỹ thuật/);
});
test('QR failure leaves manual amount, account and transfer content usable', () => {
  const { markup } = render({ qrFailure: true });
  assert.doesNotMatch(markup, /class="transfer-qr"/);
  assert.match(markup, /Không tải được QR/); assert.match(markup, /001234567890/); assert.match(markup, /495000/); assert.match(markup, /ANKTTEST123/);
});
test('Closed requests expose no transfer approval or completion actions', () => {
  const { markup } = render({ value: { ...detail, withdrawal: { ...withdrawal, status: 2 }, qrImageUrl: null } });
  assert.doesNotMatch(markup, /Duyệt và bắt đầu chuyển|Xác nhận đã chuyển tiền|Từ chối yêu cầu/);
});
test('Missing recipient account disables approval', () => {
  const { markup } = render({ value: { ...detail, withdrawal: { ...withdrawal, status: 0 }, accountNumber: null, qrImageUrl: null } });
  assert.match(markup, /Không thể đọc số tài khoản/);
  assert.match(markup, /<button[^>]+disabled=""[^>]*>Duyệt và bắt đầu chuyển/);
});
test('Copy transfer amount uses raw integer and preserves leading account zeroes', async () => {
  const copied = [];
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: async value => copied.push(value) } } });
  const { controls } = render();
  const buttons = controls.filter(button => button.children === 'Sao chép');
  await buttons[1].onClick(); await buttons[2].onClick();
  assert.deepEqual(copied, ['001234567890', '495000']);
});

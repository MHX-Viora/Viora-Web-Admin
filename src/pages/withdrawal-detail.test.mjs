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
function render({ qrFailure = false, value = detail, loading = false, error = false, action = null, reason = '', pending = false } = {}) {
  const controls = [];
  const calls = [];
  let mutationPromise = Promise.resolve();
  const overrides = {
    react: { ...React, useState: (() => { let index = 0; return initial => { const current = index++; return React.useState(current === 0 ? action : current === 1 ? reason : current === 2 && qrFailure ? value.qrImageUrl : initial); }; })() },
    'react-router-dom': { useParams: () => ({ id: 'request-fixture' }), Link: props => React.createElement('a', { href: props.to }, props.children) },
    '@tanstack/react-query': { useQuery: () => ({ data: value, isLoading: loading, isError: error, refetch: async () => {} }), useQueryClient: () => ({ invalidateQueries: async () => {} }), useMutation: config => ({ isPending: pending, mutate: () => { mutationPromise = Promise.resolve().then(config.mutationFn).then(config.onSuccess, config.onError).finally(config.onSettled); } }) },
    'sonner': { toast: { success: () => {}, error: () => {} } },
    '../services/http': { getErrorMessage: () => 'Không tải được dữ liệu' },
    './http': { apiClient: { patch: async (url, body) => { calls.push({ url, body }); return { data: { ...withdrawal, status: body.status } }; } } },
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
  return { markup: renderToStaticMarkup(React.createElement(WithdrawalDetailPage)), controls, calls, get mutationPromise() { return mutationPromise; } };
}

const confirmButton = controls => controls.find(button => Array.isArray(button.children) && button.children.includes('Xác nhận'));
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

test('Failure dialog contains its required reason field and disables empty confirmation', () => {
  const { markup, controls } = render({ action: 3 });
  const dialog = markup.slice(markup.indexOf('role="dialog"'));
  assert.match(dialog, /<textarea/);
  assert.match(dialog, /Vui lòng nhập lý do/);
  const confirm = confirmButton(controls);
  assert.ok(confirm?.disabled);
});

test('Failure and rejection confirmation accept a nonempty reason and block pending submissions', () => {
  for (const action of [3, 4]) {
    const valid = render({ action, reason: 'Thông tin tài khoản không hợp lệ' });
    const confirm = confirmButton(valid.controls);
    assert.equal(confirm?.disabled, false);
    assert.match(valid.markup.slice(valid.markup.indexOf('role="dialog"')), /Thông tin tài khoản không hợp lệ/);
    const pending = render({ action, reason: 'Thông tin tài khoản không hợp lệ', pending: true });
    assert.ok(confirmButton(pending.controls)?.disabled);
  }
});

test('An invalid recipient cannot display a transfer QR from stale response data', () => {
  const { markup } = render({ value: { ...detail, canTransfer: false } });
  assert.doesNotMatch(markup, /class="transfer-qr"/);
  assert.match(markup, /Thông tin người nhận không hợp lệ/);
});

test('Failure submits the trimmed reason once even with an invalid recipient', async () => {
  const h = render({ action: 3, reason: '  Thông tin tài khoản không hợp lệ  ', value: { ...detail, canTransfer: false, accountNumber: null } });
  const confirm = confirmButton(h.controls);
  confirm.onClick(); confirm.onClick();
  await h.mutationPromise;
  assert.deepEqual(h.calls, [{ url: '/api/admin/finance/withdrawals/request-fixture/status', body: { status: 3, reason: 'Thông tin tài khoản không hợp lệ' } }]);
});

test('Blank reason cannot send a failure request even when confirmation handler is invoked', async () => {
  const h = render({ action: 3, reason: '   ' });
  confirmButton(h.controls).onClick();
  await h.mutationPromise;
  assert.deepEqual(h.calls, []);
});

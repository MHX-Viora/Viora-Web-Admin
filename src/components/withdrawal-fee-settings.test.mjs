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

function harness({ draft = null, confirmation = null, saving = false, loading = false, error = false, rejectSave = false } = {}) {
  const controls = [], calls = [], state = [];
  let finish;
  const finished = new Promise(resolve => { finish = resolve; });
  const current = { feePercent: 10, version: 4, updatedAt: '2026-10-06T00:00:00Z', updatedBy: null };
  const overrides = {
    react: { ...React, useState: (() => { let index = 0; return initial => { const i = index++; return [i < 3 ? [draft, confirmation, saving][i] : initial, value => { state.push({ index: i, value }); }]; }; })() },
    '@tanstack/react-query': { useQuery: () => ({ data: current, isLoading: loading, isError: error, isFetching: false, refetch: async () => { finish(); } }), useQueryClient: () => ({ setQueryData: () => {}, invalidateQueries: async () => { finish(); } }) },
    'sonner': { toast: { success: () => {}, error: () => {} } },
    '../services/http': { getErrorMessage: () => 'Cấu hình đã được cập nhật, hãy tải lại.' },
    './http': { apiClient: { get: async url => { calls.push({ url }); return { data: current }; }, put: async (url, body) => { calls.push({ url, body }); if (rejectSave) throw new Error('changed'); return { data: { ...current, feePercent: body.feePercent, version: 5 } }; } } },
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
        const wrap = fn => (type, props, key) => { if (type === 'button') controls.push(props); return fn(type, props, key); };
        return { ...jsx, jsx: wrap(jsx.jsx), jsxs: wrap(jsx.jsxs) };
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
  const { WithdrawalFeeSettings } = compile(path.join(directory, 'WithdrawalFeeSettings.tsx'));
  return { markup: renderToStaticMarkup(React.createElement(WithdrawalFeeSettings)), controls, calls, state, finished, compile };
}

test('Percentage parser accepts Vietnamese decimals, rejects signs, exponent and excessive precision', () => {
  const h = harness();
  const { parseFeePercent, formatFeePercent } = h.compile(path.resolve(directory, '../utils/withdrawal-fee.ts'));
  for (const [value, expected] of [['0', 0], ['10', 10], ['12,5', 12.5], ['99.99', 99.99]]) assert.equal(parseFeePercent(value), expected);
  for (const value of ['', '-1', '100', '10.001', '1e1', 'NaN', 'Infinity']) assert.equal(parseFeePercent(value), null);
  assert.equal(formatFeePercent(12.5), '12,5%');
});
test('Editor displays current policy and exact fee/net preview and requires confirmation', () => {
  const h = harness({ draft: '12,5' });
  assert.match(h.markup, /10%/); assert.match(h.markup, /12\.500 ₫/); assert.match(h.markup, /87\.500 ₫/);
  assert.match(h.markup, /Yêu cầu đã tạo giữ nguyên phí/);
  h.controls.find(b => b.children === 'Lưu tỷ lệ phí').onClick();
  assert.deepEqual(h.state.at(-1).value, { percent: 12.5, version: 4 });
  assert.equal(h.calls.length, 0);
});
test('Invalid draft and pending save disable changes', () => {
  const invalid = harness({ draft: '100' });
  assert.match(invalid.markup, /aria-invalid="true"/);
  assert.equal(invalid.controls.find(b => b.children === 'Lưu tỷ lệ phí').disabled, true);
  const busy = harness({ draft: '20', saving: true });
  assert.equal(busy.controls.find(b => b.children === 'Lưu tỷ lệ phí').disabled, true);
});
test('Confirmed save sends captured revision and prevents duplicate submits', async () => {
  const h = harness({ confirmation: { percent: 12.5, version: 3 } });
  const button = h.controls.find(b => Array.isArray(b.children) && b.children.includes('Lưu phí mới'));
  button.onClick(); button.onClick();
  await h.finished;
  assert.deepEqual(h.calls, [{ url: '/api/admin/finance/withdrawal-fee-settings', body: { feePercent: 12.5, expectedVersion: 3 } }]);
});
test('Rejected stale save refreshes current settings and keeps draft for review', async () => {
  const h = harness({ draft: '20', confirmation: { percent: 20, version: 3 }, rejectSave: true });
  h.controls.find(b => Array.isArray(b.children) && b.children.includes('Lưu phí mới')).onClick();
  await h.finished;
  assert.equal(h.state.some(s => s.index === 3 && String(s.value).includes('tải lại')), true);
  assert.equal(h.state.some(s => s.index === 0 && s.value === null), false);
});
test('Loading and error never show an invented fee configuration', () => {
  assert.match(harness({ loading: true }).markup, /Đang tải cấu hình/);
  const failed = harness({ error: true });
  assert.match(failed.markup, /role="alert"/); assert.doesNotMatch(failed.markup, /Tỷ lệ phí/);
});

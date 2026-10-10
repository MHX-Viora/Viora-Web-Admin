import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const directory = path.dirname(fileURLToPath(import.meta.url));
function compile(file) {
  const module = new Module(file);
  module.paths = Module._nodeModulePaths(path.dirname(file));
  module.require = name => {
    if (name === '../../services/http') return { getErrorMessage: error => error instanceof Error ? error.message : 'Lỗi tải dữ liệu' };
    if (name.startsWith('.')) {
      const base = path.resolve(path.dirname(file), name);
      const target = [base + '.ts', base + '.tsx'].find(existsSync);
      if (target) return compile(target);
    }
    return require(name);
  };
  module._compile(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
  return module.exports;
}
const { ConfigFields } = compile(path.join(directory, '../src/features/developer/ConfigFields.tsx'));
const { newConfig } = compile(path.join(directory, '../src/features/developer/config.ts'));
const { VersionHistory } = compile(path.join(directory, '../src/features/developer/Shared.tsx'));
test('registration defaults to standalone login with real named radio controls', () => {
  const html = renderToStaticMarkup(React.createElement(ConfigFields, { value: newConfig(), onChange() {}, section: 2 }));
  assert.match(html, /Standard WebView/);
  assert.match(html, /name="authenticationMode" checked/);
  assert.doesNotMatch(html, /Client authentication/);
});
test('standalone mode disables identity scopes while preserving ordinary permission selection', () => {
  const html = renderToStaticMarkup(React.createElement(ConfigFields, { value: newConfig(), onChange() {}, section: 3, permissions: [{ code: 'identity.login', name: 'Danh tính', isSensitive: true }, { code: 'app.info', name: 'Thông tin', isSensitive: false }] }));
  assert.match(html, /disabled=""/);
  assert.match(html, /Nhạy cảm/);
  assert.match(html, /app.info/);
});
test('version review presents submitted configuration and reason for an Active app update', () => {
  const html = renderToStaticMarkup(React.createElement(VersionHistory, { items: [{ id: 'version-2', version: 2, status: 'Rejected', reason: 'Domain chưa xác minh', createdAt: '2026-10-09T01:00:00Z', configuration: { ...newConfig(), webUrl: 'https://shop.example', allowedDomains: ['shop.example'], callbackUrls: [] } }] }));
  assert.match(html, /Phiên bản 2/);
  assert.match(html, /Domain chưa xác minh/);
  assert.match(html, /https:\/\/shop.example/);
  assert.match(html, /Xem cấu hình gửi duyệt/);
});

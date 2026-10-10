import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
function load() {
  const file = new URL('../src/features/developer/config.ts', import.meta.url);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', source)(module, module.exports);
  return module.exports;
}
test('Independent mode allows an empty callback and rejects identity permission', () => {
  const { validateConfig, newConfig } = load();
  const config = { ...newConfig(), name: 'Shop', slug: 'shop', webUrl: 'https://shop.example', allowedDomains: ['shop.example'] };
  assert.equal(validateConfig(config), null);
  assert.match(validateConfig({ ...config, permissions: ['identity.login'] }), /SSO/);
});
test('SSO requires exact HTTPS callback and an origin without paths', () => {
  const { validateConfig, newConfig } = load();
  const config = { ...newConfig(), name: 'Shop', slug: 'shop', webUrl: 'https://shop.example', allowedDomains: ['shop.example'], permissions: ['identity.login'], authenticationMode: 'AnktSso', callbackUrls: ['https://shop.example/auth'], callbackUrl: 'https://shop.example/auth', allowedOrigins: ['https://shop.example'] };
  assert.equal(validateConfig(config), null);
  assert.match(validateConfig({ ...config, callbackUrls: [] }), /callback/i);
  assert.match(validateConfig({ ...config, allowedOrigins: ['https://shop.example/path'] }), /origin/i);
});
test('exact domains and profile permission policy match the server contract', () => {
  const { validateConfig, newConfig } = load();
  const config = { ...newConfig(), name: 'Shop', slug: 'shop', webUrl: 'https://shop.example', allowedDomains: ['shop.example'] };
  assert.match(validateConfig({ ...config, allowedDomains: ['*.example'] }), /domain/i);
  assert.match(validateConfig({ ...config, permissions: ['profile.email'] }), /SSO/);
  assert.match(validateConfig({ ...config, authenticationMode: 'AnktSso', callbackUrls: ['https://shop.example/auth'] }), /identity.login/);
});
test('unsafe URLs and unregistered website domains cannot be submitted', () => {
  const { validateConfig, newConfig } = load();
  const config = { ...newConfig(), name: 'Shop', slug: 'shop', webUrl: 'http://localhost', allowedDomains: ['localhost'] };
  assert.match(validateConfig(config), /HTTPS/);
  assert.match(validateConfig({ ...config, webUrl: 'https://shop.example', allowedDomains: ['other.example'] }), /domain/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
const require = createRequire(import.meta.url), ts = require('typescript');
function load(name, overrides = {}) {
  const file = new URL(name, import.meta.url);
  const module = new Module(file.pathname);
  module.require = key => Object.hasOwn(overrides, key) ? overrides[key] : require(key);
  module._compile(ts.transpileModule(readFileSync(file, 'utf8').replaceAll('import.meta.env', '({})'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, file.pathname);
  return module.exports;
}
const failure = (status, data, message = '') => ({ isAxiosError: true, message, response: { status, data } });
test('empty server errors always have meaningful text; ProblemDetails validation is readable', () => {
  const { getErrorMessage } = load('./http.ts');
  for (const data of ['', '   ', { message: '' }, { error: { message: '' } }, null]) {
    assert.ok(getErrorMessage(failure(404, data)).trim().length > 0);
  }
  assert.match(getErrorMessage(failure(400, { title: 'Validation failed', errors: { file: ['Choose an image'] } })), /Choose an image/);
  assert.match(getErrorMessage(failure(413, '')), /dung lượng/);
  assert.ok(getErrorMessage(new Error('')).trim());
});
test('missing upload endpoint gives an actionable error instead of blank toast', async () => {
  const { uploadAdminImage } = load('./admin-image.service.ts', {
    './http': { apiClient: { post: async () => { throw failure(404, ''); } } },
    '../lib/image-file': { imageTypes: ['image/png'], validateImageFile: () => null },
  });
  await assert.rejects(uploadAdminImage(new File(['data'], 'image.png', { type: 'image/png' })), /backend|triển khai/i);
});

test('malformed upload responses report a readable error and never return unsafe URLs', async () => {
  const file = new File(['data'], 'image.png', { type: 'image/png' });
  for (const data of [null, {}, '', '<html>Fallback</html>', { url: 'bad-url' }, { url: 'http://cdn.test/image.png' }, { url: 'https://user:pass@cdn.test/image.png' },
    { url: ' https://cdn.test/image.png' }, { url: 'https://cdn.test/\nimage.png' }, { url: 'https://cdn.test/\\image.png' }]) {
    const { uploadAdminImage } = load('./admin-image.service.ts', {
      './http': { apiClient: { post: async () => ({ data }) } },
      '../lib/image-file': { imageTypes: ['image/png'], validateImageFile: () => null },
    });
    await assert.rejects(uploadAdminImage(file), /Không thể nhận đường dẫn ảnh/);
  }
});

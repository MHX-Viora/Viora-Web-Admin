import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const ts = require('typescript');
function load() {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL('../lib/image-file.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('exports', code)(module.exports);
  return module.exports;
}
test('image selection rejects empty, oversized and unsupported files; sticker excludes JPEG', () => {
  const { validateImageFile, imageTypes, stickerImageTypes } = load();
  const valid = { type: 'image/png', size: 1024 };
  assert.equal(validateImageFile(valid, imageTypes), null);
  assert.equal(validateImageFile({ ...valid, size: 5 * 1024 * 1024 }, imageTypes), null);
  assert.ok(validateImageFile({ ...valid, size: 0 }, imageTypes));
  assert.ok(validateImageFile({ ...valid, size: 5 * 1024 * 1024 + 1 }, imageTypes));
  assert.ok(validateImageFile({ ...valid, type: 'image/svg+xml' }, imageTypes));
  assert.ok(validateImageFile({ ...valid, type: 'image/jpeg' }, stickerImageTypes));
  assert.equal(validateImageFile({ ...valid, type: 'image/webp' }, stickerImageTypes), null);
});

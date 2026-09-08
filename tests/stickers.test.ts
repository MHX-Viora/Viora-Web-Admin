import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/layouts/AdminLayout.tsx', import.meta.url), 'utf8');
const service = readFileSync(new URL('../src/services/admin-sticker.service.ts', import.meta.url), 'utf8');
const page = readFileSync(new URL('../src/pages/StickerPacksPage.tsx', import.meta.url), 'utf8');

test('admin exposes sticker management through protected API routes', () => {
  assert.match(app, /path="stickers"/);
  assert.match(layout, /to: '\/stickers'/);
  assert.match(service, /\/api\/admin\/sticker-packs/);
});

test('pack thumbnail is selected locally and uploaded with creation', () => {
  assert.doesNotMatch(page, /Thumbnail HTTPS/);
  assert.match(page, /accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(page, /type="file"/);
  assert.match(service, /form\.append\('thumbnail', thumbnail\)/);
  assert.match(service, /createStickerPack.*thumbnail: File/);
  assert.match(service, /\/thumbnail/);
  assert.match(page, /uploadStickerThumbnail/);
});

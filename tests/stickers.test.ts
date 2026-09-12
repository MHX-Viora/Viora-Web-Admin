import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/layouts/AdminLayout.tsx', import.meta.url), 'utf8');
const service = readFileSync(new URL('../src/services/admin-sticker.service.ts', import.meta.url), 'utf8');
const http = readFileSync(new URL('../src/services/http.ts', import.meta.url), 'utf8');
const page = readFileSync(new URL('../src/pages/StickerPacksPage.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/ankt-admin.css', import.meta.url), 'utf8');
const types = readFileSync(new URL('../src/types/sticker.ts', import.meta.url), 'utf8');

test('admin exposes sticker management through protected API routes', () => {
  assert.match(app, /path="stickers"/);
  assert.match(layout, /to: '\/stickers'/);
  assert.match(service, /\/api\/admin\/sticker-packs/);
});

test('sticker packs have no manual sort order', () => {
  const adminPackType = types.slice(types.indexOf('export type AdminStickerPack'), types.indexOf('export type Sticker ='));
  assert.doesNotMatch(page, /<label>Thứ tự/);
  assert.doesNotMatch(adminPackType, /sortOrder/);
  assert.doesNotMatch(service, /form\.append\('sortOrder'/);
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

test('the admin HTTP client lets Axios select the media type for FormData', () => {
  assert.match(service, /new FormData\(\)[\s\S]*form\.append\('thumbnail', thumbnail\)/);
  assert.doesNotMatch(http, /headers:\s*\{\s*'Content-Type':\s*'application\/json'/);
});

test('selected pack thumbnail is previewed before upload', () => {
  assert.match(page, /URL\.createObjectURL\(file\)/);
  assert.match(page, /URL\.revokeObjectURL/);
  assert.match(page, /src=\{thumbnailObjectUrl \|\| draft\.thumbnailUrl\}/);
});

test('thumbnail picker is a square preview that remains replaceable', () => {
  assert.match(page, /className="sticker-thumbnail-picker"/);
  assert.match(page, /aria-label=\{thumbnailPreviewUrl \? 'Thay ảnh đại diện' : 'Chọn ảnh đại diện'\}/);
  assert.match(page, /className="sticker-thumbnail-input"/);
  assert.match(page, /event\.currentTarget\.value = ''/);
  assert.match(styles, /\.sticker-thumbnail-picker\s*\{[^}]*aspect-ratio:\s*1/s);
  assert.match(styles, /\.sticker-thumbnail-picker:hover/);
  assert.match(styles, /\.sticker-thumbnail-picker:focus-within/);
});

test('missing sticker API reports the deployment problem', () => {
  assert.match(page, /response\?\.status === 404/);
  assert.match(page, /API quản lý nhãn dán chưa được triển khai trên máy chủ/);
});

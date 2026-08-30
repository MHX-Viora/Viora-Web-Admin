import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const projectRoot = new URL('../', import.meta.url);
const indexHtml = readFileSync(new URL('index.html', projectRoot), 'utf8');
const adminLayout = readFileSync(new URL('src/layouts/AdminLayout.tsx', projectRoot), 'utf8');
const loginPage = readFileSync(new URL('src/pages/LoginPage.tsx', projectRoot), 'utf8');

test('browser và shell hiển thị nhận diện ANKT', () => {
  assert.match(indexHtml, /<html lang="vi">/);
  assert.match(indexHtml, /<title>ANKT Admin<\/title>/);
  assert.match(indexHtml, /href="\/ankt-favicon\.png"/);
  assert.match(adminLayout, />ANKT Admin</);
  assert.match(adminLayout, /src="\/ankt-logo\.png"/);
  assert.match(loginPage, /src="\/ankt-logo\.png"/);
  assert.doesNotMatch(`${indexHtml}\n${adminLayout}\n${loginPage}`, /Viora Admin/i);
});

test('logo public khớp chính xác asset logo của app ANKT', () => {
  const publicLogo = new URL('public/ankt-logo.png', projectRoot);
  const appLogo = new URL('../viora/assets/images/viora_logo.png', projectRoot);
  assert.ok(existsSync(publicLogo), 'Thiếu public/ankt-logo.png');
  assert.equal(sha256(publicLogo), sha256(appLogo));
});

test('favicon public khớp bản favicon của app ANKT', () => {
  const publicFavicon = new URL('public/ankt-favicon.png', projectRoot);
  const appFavicon = new URL('../viora/assets/images/favicon.png', projectRoot);
  assert.ok(existsSync(publicFavicon), 'Thiếu public/ankt-favicon.png');
  assert.equal(sha256(publicFavicon), sha256(appFavicon));
});

function sha256(file: URL) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

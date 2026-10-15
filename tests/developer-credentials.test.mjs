import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);

test('domain and draft requests need no password; rotation sends an ANKT proof for this app', async () => {
  const calls = [], module = { exports: {} };
  const source = require('typescript').transpileModule(readFileSync(new URL('../src/services/developer.service.ts', import.meta.url), 'utf8'), { compilerOptions: { module: 1 } }).outputText;
  const client = { post: async (...args) => { calls.push(args); return { data: args[0].endsWith('/reauth') ? { proof: 'fixture-proof' } : { clientSecret: 'fixture-secret' } }; }, put: async (...args) => { calls.push(args); } };
  vm.runInNewContext(source, { module, exports: module.exports, require(name) {
    if (name === './developer-auth.service') return { developerClient: client };
    if (name === './http') return { unwrapApiData: data => data };
    throw new Error(name);
  } });
  const api = module.exports.developerApi;
  await api.addDomain('app', 'partner.example');
  await api.update('app', { webUrl: 'https://partner.example' });
  assert.equal(calls[0].length, 2); assert.equal(calls[1].length, 2);
  const { proof } = await api.reauth('fixture-password', 'RotateSecret', 'app');
  const rotated = await api.rotate('app', proof);
  assert.equal(calls[2][1].miniAppId, 'app'); assert.equal(calls[2][1].operation, 'RotateSecret');
  assert.equal(calls[3][2].headers['X-Developer-Reauth'], 'fixture-proof');
  assert.equal(rotated.clientSecret, 'fixture-secret');
  await api.addMember('account', 'Developer', 'team-proof');
  await api.updateMember('member', 'Viewer', 'team-proof');
  assert.equal(calls[4][2].headers['X-Developer-Reauth'], 'team-proof');
  assert.equal(calls[5][2].headers['X-Developer-Reauth'], 'team-proof');
});

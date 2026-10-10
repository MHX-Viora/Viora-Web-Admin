import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
function load(path, globals) {
  const module = {exports:{}};
  const code = require('typescript').transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {compilerOptions:{module:1,target:9}}).outputText;
  vm.runInNewContext(code, {module,exports:module.exports,...globals});
  return module.exports.downloadVerificationFile;
}
for (const path of ['./verification-download.ts']) {
  test(`${path}: downloads exact UTF-8 challenge with fixed filename and cleans up`, async () => {
    let blob, clicked = false, removed = false, revoked;
    const anchor = {click(){clicked=true;},remove(){removed=true;}};
    const timers=[];
    const save = load(path, {Blob, URL:{createObjectURL(value){blob=value;return 'blob:test';},revokeObjectURL(value){revoked=value;}}, document:{createElement(){return anchor;},body:{appendChild(){}}},setTimeout(fn){timers.push(fn);}});
    assert.equal(await save('test_domain-token_123'), true);
    assert.equal(anchor.download, 'ankt-mini-app-verification.txt');
    assert.equal(await blob.text(), 'test_domain-token_123');
    assert.equal(blob.type, 'text/plain;charset=utf-8');
    assert.ok(clicked && removed); timers.forEach(fn=>fn()); assert.equal(revoked,'blob:test');
    await assert.rejects(save('')); await assert.rejects(save('bad\ncontent'));
  });
}

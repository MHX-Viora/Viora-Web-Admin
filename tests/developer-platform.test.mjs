import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const source = require('typescript').transpileModule(readFileSync(new URL('../src/features/developer/registration.ts', import.meta.url), 'utf8'), { compilerOptions: { module: 1, target: 9 } }).outputText;
const module = { exports: {} }; new Function('module', 'exports', source)(module, module.exports);
const { canEditRegistration, validateRegistration } = module.exports;
test('pending snapshots and suspended/revoked organizations cannot edit registration', () => {
  for (const status of ['PendingReview', 'Suspended', 'Revoked']) assert.equal(canEditRegistration({ registrationStatus: status, membershipRole: 'Owner' }), false);
  assert.equal(canEditRegistration({ registrationStatus: 'NeedMoreInformation', membershipRole: 'Owner' }), true);
  assert.equal(canEditRegistration({ registrationStatus: 'Approved', membershipRole: 'Viewer' }), false);
});
test('organization legal fields are conditional and URL credentials are rejected', () => {
  const input = { name: 'Developer', email: 'dev@example.com', phone: '+84901234567', country: 'VN', partnerType: 'Individual' };
  assert.equal(validateRegistration(input), null);
  assert.ok(validateRegistration({ ...input, partnerType: 'Organization' }));
  const business = { ...input, partnerType: 'Business', legalName: 'Legal company', address: 'City', representativeName: 'Owner' };
  assert.ok(validateRegistration(business));
  assert.equal(validateRegistration({ ...business, website: 'https://company.example' }), null);
  assert.ok(validateRegistration({ ...input, website: 'https://secret:password@example.com' }));
  assert.ok(validateRegistration({ ...input, website: 'http://company.example' }));
});

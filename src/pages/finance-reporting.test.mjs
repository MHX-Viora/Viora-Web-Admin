import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const file = path.resolve('src/utils/finance-reporting.ts');
const compiled = new Module(file);
compiled._compile(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, file);
const { defaultFinancePeriod, validFinancePeriod, groupRevenue } = compiled.exports;

test('default period follows Vietnam date across UTC month boundary', () => {
  assert.deepEqual(defaultFinancePeriod(new Date('2026-10-31T18:00:00Z')), { from: '2026-11-01', to: '2026-11-01' });
});
test('period rejects reversed, missing, impossible and overlong dates', () => {
  assert.equal(validFinancePeriod('2026-10-28', '2026-10-28'), true);
  for (const [from, to] of [['', '2026-10-28'], ['2026-10-28', '2026-10-01'], ['2026-02-30', '2026-03-01'], ['2025-01-01', '2026-01-02']]) assert.equal(validFinancePeriod(from, to), false);
});
test('monthly trend preserves signed refunds and total', () => {
  const daily = [{ date: '2026-09-30', advertisingRevenue: 2000, withdrawalFeeRevenue: 0, totalRevenue: 2000 }, { date: '2026-10-01', advertisingRevenue: 1000, withdrawalFeeRevenue: 500, totalRevenue: 1500 }, { date: '2026-10-02', advertisingRevenue: -200, withdrawalFeeRevenue: 0, totalRevenue: -200 }];
  assert.deepEqual(groupRevenue(daily, true), [{ date: '2026-09', advertisingRevenue: 2000, withdrawalFeeRevenue: 0, totalRevenue: 2000 }, { date: '2026-10', advertisingRevenue: 800, withdrawalFeeRevenue: 500, totalRevenue: 1300 }]);
  assert.deepEqual(groupRevenue(daily, false), daily);
});

import { readFileSync, existsSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url), ts = require('typescript'), React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');
export function load(file, overrides = {}) {
  const cache = new Map();
  function compile(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const mod = new Module(file); cache.set(file, mod); mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod.require = name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.endsWith('.css')) return {};
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(file), name), candidate = [base + '.ts', base + '.tsx'].find(existsSync);
        if (candidate) return compile(candidate);
      }
      return require(name);
    };
    mod._compile(ts.transpileModule(readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
    return mod.exports;
  }
  return compile(path.resolve(file));
}
export function render(Component, props) { return renderToStaticMarkup(React.createElement(MemoryRouter, {}, React.createElement(Component, props))); }

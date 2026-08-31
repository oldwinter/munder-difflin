'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { transpileTs } = require('./transpile-ts.cjs');

const cache = new Map();

function resolveTs(fromDir, request) {
  const base = request.startsWith('@shared/')
    ? path.resolve(__dirname, '..', 'src/shared', request.slice('@shared/'.length))
    : path.resolve(fromDir, request);
  for (const candidate of [base, `${base}.ts`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function loadFile(filename) {
  const cached = cache.get(filename);
  if (cached) return cached.exports;
  // A `.json` import is data, not TypeScript. The bundler parses it (the app
  // compiles with resolveJsonModule); handing it to transpileModule instead
  // fails output generation outright, so parse it the same way here.
  if (filename.endsWith('.json')) {
    const json = { exports: JSON.parse(fs.readFileSync(filename, 'utf8')) };
    cache.set(filename, json);
    return json.exports;
  }
  const source = fs.readFileSync(filename, 'utf8');
  const output = transpileTs(source, filename);
  const mod = { exports: {} };
  cache.set(filename, mod);
  const localRequire = (request) => {
    if (request.startsWith('.') || request.startsWith('@shared/')) {
      const resolved = resolveTs(path.dirname(filename), request);
      if (resolved) return loadFile(resolved);
    }
    return require(request);
  };
  const run = new Function('module', 'exports', 'require', '__filename', '__dirname', output);
  run(mod, mod.exports, localRequire, filename, path.dirname(filename));
  return mod.exports;
}

/** Load a TypeScript module and its local TypeScript imports for node:test. */
module.exports = function loadTs(relativePath) {
  return loadFile(path.resolve(__dirname, '..', relativePath));
};

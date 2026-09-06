'use strict';

const { transformSync } = require('esbuild');

/** Transpile a TypeScript module for the CommonJS-based node:test harness. */
function transpileTs(source, sourcefile = 'inline.ts') {
  return transformSync(source, {
    format: 'cjs',
    loader: 'ts',
    sourcefile,
    target: 'es2022'
  }).code;
}

module.exports = { transpileTs };

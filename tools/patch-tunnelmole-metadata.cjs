#!/usr/bin/env node
'use strict';

const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

function removeSelfDependency(packagePath) {
  if (!existsSync(packagePath)) return false;
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  if (!pkg.dependencies?.tunnelmole) return false;
  delete pkg.dependencies.tunnelmole;
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  return true;
}

if (require.main === module) {
  const packagePath = join(__dirname, '..', 'node_modules', 'tunnelmole', 'package.json');
  if (removeSelfDependency(packagePath)) {
    console.log('[patch-tunnelmole-metadata] removed tunnelmole self-dependency');
  }
}

module.exports = { removeSelfDependency };

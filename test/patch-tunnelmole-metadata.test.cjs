'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { removeSelfDependency } = require('../tools/patch-tunnelmole-metadata.cjs');

test('removes only tunnelmole package metadata self-dependency and is idempotent', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tunnelmole-metadata-'));
  const packagePath = join(dir, 'package.json');
  writeFileSync(packagePath, JSON.stringify({
    name: 'tunnelmole',
    version: '2.4.0',
    dependencies: { axios: '^1.3.5', tunnelmole: '^2.1.6' }
  }));

  assert.equal(removeSelfDependency(packagePath), true);
  assert.deepEqual(JSON.parse(readFileSync(packagePath, 'utf8')).dependencies, { axios: '^1.3.5' });
  assert.equal(removeSelfDependency(packagePath), false);
});

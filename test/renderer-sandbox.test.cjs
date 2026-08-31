'use strict';

/**
 * Pins the Electron renderer boundary on every application-created window.
 *
 * The desktop can run inside a hardened container while its web renderer is
 * still unsandboxed: Electron turns `webPreferences.sandbox: false` into an
 * effective renderer `--no-sandbox` switch. Parse the TypeScript AST so comments,
 * unrelated objects, or string markers cannot satisfy this security contract.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@babel/parser');

const sourcePath = path.join(__dirname, '..', 'src', 'main', 'index.ts');

function property(object, name) {
  return object.properties.find((entry) => (
    entry.type === 'ObjectProperty'
    && ((entry.key.type === 'Identifier' && entry.key.name === name)
      || (entry.key.type === 'StringLiteral' && entry.key.value === name))
  ));
}

function browserWindowOptions() {
  const text = fs.readFileSync(sourcePath, 'utf8');
  const source = parse(text, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const windows = [];

  function visit(node) {
    if (
      node.type === 'NewExpression'
      && node.callee.type === 'Identifier'
      && node.callee.name === 'BrowserWindow'
    ) {
      windows.push(node.arguments?.[0]);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child?.type) visit(child);
      } else if (value?.type) {
        visit(value);
      }
    }
  }

  visit(source);
  return windows;
}

test('every BrowserWindow explicitly enables the Chromium renderer sandbox', () => {
  const windows = browserWindowOptions();
  assert.ok(windows.length > 0, 'no BrowserWindow construction found');

  for (const options of windows) {
    assert.equal(options?.type, 'ObjectExpression', 'BrowserWindow options must be literal');
    const webPreferences = property(options, 'webPreferences');
    assert.ok(
      webPreferences && webPreferences.value.type === 'ObjectExpression',
      'BrowserWindow webPreferences must be literal'
    );
    const sandbox = property(webPreferences.value, 'sandbox');
    assert.ok(sandbox, 'BrowserWindow must declare sandbox explicitly');
    assert.equal(sandbox.value.type, 'BooleanLiteral');
    assert.equal(sandbox.value.value, true);
  }
});

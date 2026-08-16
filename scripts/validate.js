// Validates that work-rest-timer.client.js is a syntactically valid dynamic
// Cordis plugin Client body: a plain-JS "function body" whose top-level
// `return { ... }` yields a Plugin object exposing `apply(ctx)` and `inject`.
//
// Run locally with: node scripts/validate.js

const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'work-rest-timer.client.js')
const src = fs.readFileSync(file, 'utf8')

let plugin
try {
  // The file is a function body (starts with `return { ... }`), so compile and
  // run it directly to obtain the Plugin object. No globals are referenced at
  // the top level, so this is safe.
  const compile = new Function(src)
  plugin = compile()
} catch (err) {
  console.error('✗ work-rest-timer.client.js is not valid:')
  console.error(err && err.stack ? err.stack : String(err))
  process.exit(1)
}

if (!plugin || typeof plugin !== 'object') {
  console.error('✗ plugin body must return an object, got:', typeof plugin)
  process.exit(1)
}
if (typeof plugin.apply !== 'function') {
  console.error('✗ plugin object must expose apply(ctx) as a function.')
  process.exit(1)
}
if (!Array.isArray(plugin.inject)) {
  console.error('✗ plugin object must declare inject: [...]')
  process.exit(1)
}

console.log('✓ work-rest-timer.client.js is a valid dynamic Cordis plugin body')
console.log('  inject:', JSON.stringify(plugin.inject))

// Keep the native test-transformer cache inside the project for sandboxed/CI runs.
const path = require('node:path');
process.env.SWC_NATIVE_BINDING_CACHE ||= path.join(__dirname, '..', 'node_modules', '.cache', 'swc-native');
require('jest').run(process.argv.slice(2));

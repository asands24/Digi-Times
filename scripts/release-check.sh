#!/usr/bin/env bash
set -euo pipefail

npm ci
npm run build
npm test -- --watchAll=false
echo "OK"

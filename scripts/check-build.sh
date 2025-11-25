#!/bin/bash
# Quick build validation script
# Runs type-check (fast) and optionally a full build

set -e

echo "🔍 Running type-check..."
pnpm type-check

if [ "$1" == "--full" ]; then
  echo "🏗️  Running full build..."
  pnpm build
  echo "✅ Build successful!"
else
  echo "✅ Type-check passed!"
  echo "💡 Tip: Run with --full flag to test the actual build"
fi


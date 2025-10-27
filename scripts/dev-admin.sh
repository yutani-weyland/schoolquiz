#!/bin/bash

# Kill any existing admin dev server on port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Stopping existing server on port 3000..."
  kill $(lsof -ti :3000)
  sleep 1
fi

# Start dev server
echo "Starting admin dev server on port 3000..."
cd /Users/fong/Documents/schoolquiz/schoolquiz
pnpm --filter @schoolquiz/admin dev -p 3000


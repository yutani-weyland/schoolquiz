#!/bin/bash

# Kill any existing web dev server on port 4321
if lsof -Pi :4321 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Stopping existing server on port 4321..."
  kill $(lsof -ti :4321)
  sleep 1
fi

# Start dev server
echo "Starting web dev server on port 4321..."
cd /Users/fong/Documents/schoolquiz/schoolquiz
pnpm --filter @schoolquiz/web dev


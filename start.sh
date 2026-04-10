#!/bin/bash
cd /home/z/my-project
while true; do
  bun run dev &
  PID=$!
  sleep 20
  if kill -0 $PID 2>/dev/null; then
    wait $PID 2>/dev/null
  fi
  echo "[$(date)] Restarting..."
  sleep 2
done

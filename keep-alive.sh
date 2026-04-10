#!/bin/bash
while true; do
  cd /home/z/my-project
  npx next dev -p 3000 &
  SERVER_PID=$!
  
  # Keep server alive by pinging every 10 seconds
  for i in $(seq 1 360); do
    sleep 10
    if ! kill -0 $SERVER_PID 2>/dev/null; then
      echo "Server died, restarting..."
      break
    fi
    curl -s -o /dev/null http://localhost:3000/ 2>/dev/null
  done
  
  kill $SERVER_PID 2>/dev/null
  wait $SERVER_PID 2>/dev/null
  echo "Restarting server..."
  sleep 3
done

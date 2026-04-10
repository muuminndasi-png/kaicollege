const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// Simple proxy that also keeps Next.js alive
const TARGET = 'http://localhost:3000';

let nextProcess = null;

function startNext() {
  if (nextProcess) {
    try { nextProcess.kill(); } catch(e) {}
  }
  
  nextProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PATH: process.env.PATH }
  });
  
  nextProcess.stdout.on('data', d => process.stdout.write(d));
  nextProcess.stderr.on('data', d => process.stderr.write(d));
  nextProcess.on('exit', () => {
    console.log('Next.js exited, restarting in 3s...');
    setTimeout(startNext, 3000);
  });
}

startNext();

// Health check - ping localhost:3000 every 5s
setInterval(() => {
  http.get('http://localhost:3000/', (res) => {
    res.resume();
  }).on('error', () => {});
}, 5000);

// Keep this process alive
process.on('SIGTERM', () => process.exit(0));

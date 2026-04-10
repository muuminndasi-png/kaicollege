const { spawn } = require('child_process');
const http = require('http');

let nextProc = null;

function start() {
  console.log('[proxy] Starting Next.js dev server on port 3000...');
  nextProc = spawn('npx', ['next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PATH: '/home/z/.venv/bin:' + process.env.PATH }
  });
  
  nextProc.stdout.on('data', (d) => process.stdout.write(d));
  nextProc.stderr.on('data', (d) => process.stderr.write(d));
  nextProc.on('exit', (code) => {
    console.log('[proxy] Next.js exited with code ' + code + ', restarting in 5s...');
    setTimeout(start, 5000);
  });
}

start();

// Keep-alive: ping every 3 seconds
setInterval(() => {
  http.get('http://localhost:3000/', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {});
  }).on('error', () => {});
}, 3000);

// Prevent process from exiting
setInterval(() => {}, 60000);

process.on('SIGTERM', () => {
  if (nextProc) nextProc.kill();
  process.exit(0);
});

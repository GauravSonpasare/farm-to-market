const WebSocket = require('ws');
// Try to connect directly to the backend
const backendWs = new WebSocket('ws://localhost:3000/api/ws', {
  headers: {
    Cookie: 'token=dummy_token_to_bypass_or_fail'
  }
});
backendWs.on('open', () => console.log('Backend WS connected'));
backendWs.on('error', (e) => console.log('Backend WS error:', e.message));
backendWs.on('close', (code, reason) => console.log('Backend WS closed:', code, reason.toString()));

// Try Vite dev server
const viteWs = new WebSocket('ws://localhost:5174/api/ws', {
  headers: {
    Cookie: 'token=dummy_token_to_bypass_or_fail'
  }
});
viteWs.on('open', () => console.log('Vite WS connected'));
viteWs.on('error', (e) => console.log('Vite WS error:', e.message));
viteWs.on('close', (code, reason) => console.log('Vite WS closed:', code, reason.toString()));

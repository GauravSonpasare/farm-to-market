const ws2 = new WebSocket("ws://localhost:5174/api/ws");

ws2.addEventListener("open", () => {
    console.log("Vite Proxy Connection Open!");
});
ws2.addEventListener("message", (msg) => {
    console.log("Message received:", msg.data);
});
ws2.addEventListener("error", (e) => {
    console.error("Vite Proxy Error", e.message);
});
ws2.addEventListener("close", (e) => {
    console.log("Closed with code:", e.code, e.reason);
});

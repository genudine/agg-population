const WebSocket = require("ws");

const wsc = new WebSocket(
  "wss://planetside-2-api.herokuapp.com/socket.io/?EIO=3&transport=websocket",
  {
    origin: "https://ps2.nice.kiwi",
  }
);

wsc.on("open", () => {
  wsc.send(`42["worlds-update-request"]`);
});

wsc.on("message", (e) => {
  const messageRaw = e.toString();

  if (messageRaw.startsWith("42")) {
    const [event, message] = JSON.parse(messageRaw.slice(2));
    console.log({ message });
    wsc.close();
  }
});

const socketio = require("socket.io-client");

const client = socketio("https://planetside-2-api.herokuapp.com", {
  transports: ["websocket"],
  extraHeaders: {
    Origin: "https://ps2.nice.kiwi",
  },
});

client.on("connect", (e) => {
  console.log("Connected to server", { e });
  client.emit("worlds-update-request");
});

client.on("worlds-update", (e) => {
  console.log(e);
});

client.on("disconnect", () => {
  console.log("Disconnected from server");
});

client.on("error", (e) => {
  console.log({ error: e });
});

client.on("connect_error", (e) => {
  console.log({
    connectError: e,
  });
});

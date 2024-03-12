// src/wsAdapter-client.ts
function generateRequestId() {
  return Math.random().toString(36).substring(2, 10);
}
function createWsClientProxy(socket) {
  const requestCallbacks = /* @__PURE__ */ new Map();
  const eventsCallbacks = /* @__PURE__ */ new Map();
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data.toString());
    const messageId = data.messageId;
    if (requestCallbacks.has(messageId)) {
      const callback = requestCallbacks.get(messageId);
      if (callback) {
        requestCallbacks.delete(messageId);
        callback(data);
      }
    }
    if (eventsCallbacks.has(data.event)) {
      const callback = eventsCallbacks.get(data.event);
      if (callback) {
        callback(data);
      }
    }
  });
  return {
    emit: (event, payload) => {
      const messageId = generateRequestId();
      const promise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          requestCallbacks.delete(messageId);
          reject(new Error("Request timed out"));
        }, 5e3);
        requestCallbacks.set(messageId, (response) => {
          clearTimeout(timeout);
          if (response.data.success) {
            resolve(response.data.data);
          }
        });
      });
      socket.send(JSON.stringify({ messageId, event, data: payload }));
      return promise;
    },
    on: (event, callback) => {
      eventsCallbacks.set(event, (response) => {
        callback(response.data);
      });
    }
  };
}
export {
  createWsClientProxy
};
//# sourceMappingURL=client.mjs.map
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/wsAdapter-client.ts
var wsAdapter_client_exports = {};
__export(wsAdapter_client_exports, {
  createWsClientProxy: () => createWsClientProxy
});
module.exports = __toCommonJS(wsAdapter_client_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createWsClientProxy
});
//# sourceMappingURL=client.js.map
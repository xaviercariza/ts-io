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

// src/wsAdapter-server.ts
var wsAdapter_server_exports = {};
__export(wsAdapter_server_exports, {
  createWsServerProxy: () => createWsServerProxy
});
module.exports = __toCommonJS(wsAdapter_server_exports);
var import_uuid = require("uuid");
function createWsServerProxy(wsServer, socket) {
  const emitToClient = (to, data) => {
    wsServer.clients.forEach((ws) => {
      if (
        /* ws.id === socketId &&  */
        socket.readyState === socket.OPEN
      ) {
        ws.send(JSON.stringify(data));
      }
    });
  };
  return {
    emitTo: (to, event, data) => {
      const messageId = (0, import_uuid.v4)();
      emitToClient(to, { messageId, event, data });
    },
    // acknowledge: output => {
    //   wsServer.clients.forEach(ws => {
    //     if (socket.id === ws.id && socket.readyState === socket.OPEN) {
    //       ws.send(JSON.stringify(output))
    //     }
    //   })
    // },
    on: (eventKey, handler) => {
      socket.on("message", (msg) => {
        const { messageId, event, data } = JSON.parse(msg.toString());
        if (event === eventKey) {
          handler(data, (response) => {
            wsServer.clients.forEach((ws) => {
              if (socket.id === ws.id && socket.readyState === socket.OPEN) {
                ws.send(JSON.stringify({ messageId, event, data: response }));
              }
            });
          });
        }
      });
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createWsServerProxy
});
//# sourceMappingURL=server.js.map
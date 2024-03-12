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

// src/server/index.ts
var server_exports = {};
__export(server_exports, {
  createSocketIoServerProxy: () => createSocketIoServerProxy
});
module.exports = __toCommonJS(server_exports);
var import_uuid = require("uuid");
function createSocketIoServerProxy(socket) {
  const emitToClient = (socketId, response) => {
    const { event, data } = response;
    socket.to(socketId).emit(event, data);
  };
  return {
    emitTo: (to, event, data) => {
      const messageId = (0, import_uuid.v4)();
      const response = { messageId, event, data };
      emitToClient(to, response);
    },
    // acknowledge: output => {
    //   return output
    // },
    on: (event, handler) => {
      socket.on(event, (data, callback) => {
        handler(data, (output) => {
          callback({ data: output });
        });
      });
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSocketIoServerProxy
});
//# sourceMappingURL=server.js.map
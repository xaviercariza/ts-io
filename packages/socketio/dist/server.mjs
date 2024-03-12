// src/server/index.ts
import { v4 as uuidv4 } from "uuid";
function createSocketIoServerProxy(socket) {
  const emitToClient = (socketId, response) => {
    const { event, data } = response;
    socket.to(socketId).emit(event, data);
  };
  return {
    emitTo: (to, event, data) => {
      const messageId = uuidv4();
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
export {
  createSocketIoServerProxy
};
//# sourceMappingURL=server.mjs.map
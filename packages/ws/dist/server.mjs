// src/wsAdapter-server.ts
import { v4 as uuidv4 } from "uuid";
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
      const messageId = uuidv4();
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
export {
  createWsServerProxy
};
//# sourceMappingURL=server.mjs.map
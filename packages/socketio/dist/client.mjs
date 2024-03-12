// src/client/index.ts
function createSocketIoClientProxy(socket) {
  return {
    emit: (event, payload, callback) => {
      socket.emit(event, payload, (response) => {
        if (callback) {
          callback(response.data);
        }
      });
    },
    on: (event, callback) => {
      socket.on(event, callback);
    }
  };
}
export {
  createSocketIoClientProxy
};
//# sourceMappingURL=client.mjs.map
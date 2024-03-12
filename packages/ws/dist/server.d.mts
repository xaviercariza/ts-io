import { IoContract, TsIoServerAdapter } from '@ts-io/core';
import WebSocket, { WebSocketServer } from 'ws';

type TsIoWebSocket = WebSocket.WebSocket & {
    id?: string;
};
type TsIoWebSocketServer = Omit<WebSocketServer, 'clients'> & {
    clients: Set<TsIoWebSocket>;
};
declare function createWsServerProxy<Contract extends IoContract>(wsServer: TsIoWebSocketServer, socket: TsIoWebSocket): TsIoServerAdapter<Contract>;

export { type TsIoWebSocket, createWsServerProxy };

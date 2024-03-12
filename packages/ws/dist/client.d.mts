import { IoContract, TsIoClientAdapter } from '@ts-io/core';
import WebSocket from 'ws';

declare function createWsClientProxy<Contract extends IoContract>(socket: WebSocket): TsIoClientAdapter<Contract>;

export { createWsClientProxy };

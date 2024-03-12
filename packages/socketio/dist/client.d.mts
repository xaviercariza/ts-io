import { IoContract, TsIoClientAdapter } from '@ts-io/core';
import { Socket } from 'socket.io-client';

declare function createSocketIoClientProxy<Contract extends IoContract>(socket: Socket): TsIoClientAdapter<Contract>;

export { createSocketIoClientProxy };

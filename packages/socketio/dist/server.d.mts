import { IoContract, TsIoServerAdapter } from '@ts-io/core';
import { Socket } from 'socket.io';

type TsIoScoketIoSocket = Socket & {
    id?: string;
};
declare function createSocketIoServerProxy<Contract extends IoContract>(socket: TsIoScoketIoSocket): TsIoServerAdapter<Contract>;

export { createSocketIoServerProxy };

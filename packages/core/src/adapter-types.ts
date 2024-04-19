import { z } from 'zod'
import {
  InferSocketActions,
  IoAction,
  IoContract,
  IoListeners,
  TActionWithAck,
  TBaseAction,
  TResponse,
} from './types'
import { MaybePromise } from './server/types'

type TsIoServerHandler<Action extends IoAction> = Action extends TActionWithAck
  ? (input: Action['input']) => Promise<TResponse<z.infer<Action['response']>>>
  : Action extends TBaseAction
    ? (input: Action['input']) => Promise<void>
    : never

type TsIoEventMessage<Data> = { messageId: string; event: string; data: Data }
type TsIoServerEmitter = (to: string, output: TsIoEventMessage<TResponse<any>>) => void
type TsIoServerAcknowledgeEmitter<
  Actions extends InferSocketActions<IoContract>,
  Event extends keyof Actions,
> = (output: TsIoEventMessage<TResponse<Actions[Event]>>) => void

type TsIoServerAdapter<Action extends IoAction> = {
  emitTo<Event extends string, Response extends TResponse<any>>(
    to: string,
    event: Event,
    data: Response
  ): void
  on<Event extends string>(event: Event, handler: TsIoServerHandler<Action>): MaybePromise<void>
}

type TsIoClientAdapter<Contract extends IoContract> = {
  emit: <
    ActionEvent extends keyof Contract['actions'],
    ListenerEvent extends keyof Contract['listeners'],
  >(
    action: ActionEvent,
    payload: Contract['actions'][ActionEvent]['input'],
    callback?: Contract['listeners'][ListenerEvent] extends IoListeners
      ? Contract['actions'][ActionEvent] extends TActionWithAck
        ? (response: TResponse<Contract['listeners'][ListenerEvent]['data']>) => void
        : never
      : never
  ) => Promise<any> | void
  on: <ListenerEvent extends keyof Contract['listeners']>(
    action: ListenerEvent,
    cb: Contract['listeners'][ListenerEvent] extends IoListeners
      ? (data: Contract['listeners'][ListenerEvent]['data']) => void
      : never
  ) => void
}

export type {
  TsIoClientAdapter,
  TsIoEventMessage,
  TsIoServerAcknowledgeEmitter,
  TsIoServerAdapter,
  TsIoServerEmitter,
  TsIoServerHandler,
}

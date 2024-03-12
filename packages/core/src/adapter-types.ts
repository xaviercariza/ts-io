import { InferContractActions, IoContract, IoListeners, TActionWithAck, TResponse } from './types'

type TsIoEventMessage<Data> = { messageId: string; event: string; data: Data }
type TsIoServerEmitter = (to: string, output: TsIoEventMessage<TResponse<any>>) => void
type TsIoServerAcknowledgeEmitter<
  Actions extends InferContractActions<IoContract>,
  Event extends keyof Actions,
> = (output: TsIoEventMessage<TResponse<Actions[Event]>>) => void

type TsIoServerAdapter<Contract extends IoContract> = {
  emitTo<Event extends string, Response extends TResponse<any>>(
    to: string,
    event: Event,
    data: Response
  ): void
  // acknowledge: <Actions extends InferContractActions<IoContract>, Event extends keyof Actions>(
  //   output: TsIoEventMessage<TResponse<Actions[Event]>>
  // ) => void
  on<Event extends keyof Contract['actions']>(
    event: Event,
    callback: (
      input: Contract['actions'][Event]['input'],
      callback: (output: TResponse<any>) => void
    ) => Promise<void>
  ): void
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
}

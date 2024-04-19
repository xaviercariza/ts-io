import { IoListeners, ParseSchema } from '../types'

type AnyEmitEventToFunction = EmitEventToFunction<any>

export type EmitEventToFunction<Listeners extends IoListeners | undefined> = <
  ListenerKey extends Listeners extends IoListeners ? keyof Listeners : never,
>(
  listenerKey: Listeners extends IoListeners ? keyof Listeners : never,
  socketId: string,
  listenerSchema: Listeners extends IoListeners
    ? ListenerKey extends keyof Listeners
      ? ParseSchema<Listeners[ListenerKey]['data']>
      : never
    : never
) => void

export type { AnyEmitEventToFunction }

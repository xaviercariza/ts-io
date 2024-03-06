import { ZodType, z } from 'zod'
import { IoAction, IoActions, IoListener, IoListeners, TActionWithAck, TBaseAction } from './types'

const getResponseUnionSchema = <Data extends ZodType>(data: Data) =>
  z.discriminatedUnion('success', [
    z.object({ success: z.literal(true), data }),
    z.object({ success: z.literal(false), error: z.string() }),
  ])

const isBasicAction = (action: TBaseAction | TActionWithAck): action is TBaseAction => {
  return 'input' in action && !('response' in action)
}

const isIoActionWithAck = (action: TBaseAction | TActionWithAck): action is TActionWithAck => {
  return 'input' in action && 'response' in action
}

const isIoAction = (obj: IoActions | IoAction): obj is IoAction => {
  return 'input' in obj
}

const isIoListener = (obj: IoListeners | IoListener): obj is IoListener => {
  return 'data' in obj
}

export { getResponseUnionSchema, isBasicAction, isIoAction, isIoActionWithAck, isIoListener }

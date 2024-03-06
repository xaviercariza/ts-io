 
import { z } from "zod";

type ActionOptions = {
  validate?: boolean;
};
type ListenerOptions = {
  validate?: boolean;
};

type TBaseAction = {
  input: z.ZodSchema;
  options?: ActionOptions;
};

type TActionWithAck = TBaseAction & {
  response: z.ZodSchema;
};

type IoAction = TBaseAction | TActionWithAck;
type IoListener = ListenerOptions & { data: z.ZodSchema | Zod.ZodVoid };

type IoActions = Record<string, IoAction>;
type IoListeners = Record<string, IoListener>;

type IoContract = {
  actions: IoActions;
  listeners?: IoListeners;
};

type TSuccessResponse<Data> = { success: true; data: Data };
type ErrorResponse = { success: false; error: string };
type TResponse<Data> = TSuccessResponse<Data> | ErrorResponse;

type InferContractActions<Contract extends IoContract> = {
  [ActionKey in keyof Contract["actions"]]: (
    input: Contract["actions"][ActionKey] extends IoAction
      ? z.infer<Contract["actions"][ActionKey]["input"]>
      : never,
    callback: Contract["actions"][ActionKey] extends TActionWithAck
      ? (
          output: TResponse<z.infer<Contract["actions"][ActionKey]["response"]>>
        ) => Promise<void> | void
      : undefined
  ) => void;
};

type InferContractListeners<Contract extends IoContract> = {
  [ActionKey in keyof Contract["listeners"]]: (
    data: Contract["listeners"][ActionKey] extends IoListener
      ? z.infer<Contract["listeners"][ActionKey]["data"]>
      : never
  ) => void;
};

export type {
  ActionOptions,
  InferContractActions,
  InferContractListeners,
  IoAction,
  IoActions,
  IoContract,
  IoListener,
  IoListeners,
  TActionWithAck,
  TBaseAction,
  TResponse,
  TSuccessResponse,
};

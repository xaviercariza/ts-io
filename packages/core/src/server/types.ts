type WithoutIndexSignature<TObj> = {
  [K in keyof TObj as string extends K ? never : number extends K ? never : K]: TObj[K]
}

export type Overwrite<TType, TWith> = TWith extends any
  ? TType extends object
    ? {
        [K in  // Exclude index signature from keys
          | keyof WithoutIndexSignature<TType>
          | keyof WithoutIndexSignature<TWith>]: K extends keyof TWith
          ? TWith[K]
          : K extends keyof TType
            ? TType[K]
            : never
      } & (string extends keyof TWith // Handle cases with an index signature
        ? { [key: string]: TWith[string] }
        : number extends keyof TWith
          ? { [key: number]: TWith[number] }
          : // eslint-disable-next-line @typescript-eslint/ban-types
            {})
    : TWith
  : never

export type Simplify<TType> = TType extends any[] | Date ? TType : { [K in keyof TType]: TType[K] }

export type MaybePromise<TType> = Promise<TType> | TType

export type Unwrap<TType> = TType extends (...args: any[]) => infer R ? Awaited<R> : TType

export type ValueOf<TObj> = TObj[keyof TObj]

/**
 * @internal
 */
export type ValidateShape<TActualShape, TExpectedShape> = TActualShape extends TExpectedShape
  ? Exclude<keyof TActualShape, keyof TExpectedShape> extends never
    ? TActualShape
    : TExpectedShape
  : never

export const ERROR_SYMBOL = Symbol('TypeError')
export type TypeError<TMessage extends string> = TMessage & {
  _: typeof ERROR_SYMBOL
}

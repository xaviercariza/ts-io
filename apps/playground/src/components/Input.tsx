import clsx from 'clsx'
import type React from 'react'

type Props = React.HTMLProps<HTMLInputElement> & {
  fullWidth?: boolean
}

export function Input({ value, onChange, fullWidth = false, className, ...rest }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      className={clsx(
        'flex border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10 placeholder:text-slate-300',
        className,
        { 'w-full': fullWidth }
      )}
      {...rest}
    />
  )
}

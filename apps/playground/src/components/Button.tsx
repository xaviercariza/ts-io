import clsx from 'clsx'
import React from 'react'

type Props = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>

export function Button({ onClick, className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-1 flex-shrink-0',
        'disabled:bg-indigo-400 disabled:text-indigo-300',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

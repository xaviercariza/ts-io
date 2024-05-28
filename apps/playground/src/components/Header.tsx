import clsx from 'clsx'
import type { ReactNode } from 'react'

type Props = { left?: ReactNode; right?: ReactNode }

export function Header({ left, right }: Props) {
  return (
    <div className="bg-white z-50 flex items-center justify-between w-full rounded-2xl">
      <div
        className={clsx('flex items-start bg-white py-2 px-4 rounded-2xl w-auto', {
          invisible: !left,
        })}
      >
        {left}
      </div>
      {right}
    </div>
  )
}

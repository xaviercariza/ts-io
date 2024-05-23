import clsx from 'clsx'
import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = { header?: ReactNode; fullScreen?: boolean; className?: string; children: ReactNode }

export function Card({ header, fullScreen = false, className, children }: Props) {
  return (
    <div
      className={clsx('flex h-auto antialiased text-gray-800 w-full', {
        'h-screen': fullScreen,
      })}
    >
      <div className="flex flex-row h-full w-full overflow-x-hidden">
        <div className="flex flex-col flex-auto h-full p-6">
          <div
            className={twMerge(
              'flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full border border-slate-300 shadow-sm',
              className
            )}
          >
            {header}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

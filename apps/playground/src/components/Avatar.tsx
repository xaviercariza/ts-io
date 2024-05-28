import clsx from 'clsx'
import { getUserAvatarColor } from '../utils/color'
import type { ReactNode } from 'react'

type Size = 'sm' | 'md' | 'lg'

type Props = {
  nickname: string
  size: Size
  displayName?: boolean
  className?: string
  children?: ReactNode
}

export function Avatar({ nickname, size = 'md', displayName = false, className, children }: Props) {
  const backgroundColor = getUserAvatarColor(nickname)

  return (
    <div className="flex flex-row items-center justify-center">
      <div
        style={{ backgroundColor }}
        className={clsx(
          'inline-flex items-center justify-center rounded-full text-white',
          className,
          {
            'w-8 h-8 text-md': size === 'sm',
            'w-10 h-10 text-lg': size === 'md',
            'w-16 h-16 text-3xl': size === 'lg',
          }
        )}
      >
        {nickname.charAt(0).toUpperCase()}
      </div>
      <div className="ml-2 flex flex-col">
        {displayName && <div className="text-sm font-bold">{nickname}</div>}
        {children}
      </div>
    </div>
  )
}

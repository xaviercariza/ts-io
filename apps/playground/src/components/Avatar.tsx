import clsx from 'clsx'
import { getUserAvatarColor } from '../utils/color'

type Size = 'sm' | 'md' | 'lg'

type Props = {
  nickname: string
  size: Size
  displayName?: boolean
  className?: string
}

export function Avatar({ nickname, size = 'md', displayName = false, className }: Props) {
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
      {displayName && <div className="ml-2 text-sm font-bold">{nickname}</div>}
    </div>
  )
}

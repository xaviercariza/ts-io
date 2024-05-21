import { type ReactNode } from 'react'

type Props = { children: ReactNode }

export function Layout({ children }: Props) {
  return (
    <div className="bg-gray-200 h-screen">
      <div className="flex flex-row w-full h-32 bg-indigo-500">{children}</div>
    </div>
  )
}

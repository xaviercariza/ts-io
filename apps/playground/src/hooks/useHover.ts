import type React from 'react'
import { useEffect, useRef, useState } from 'react'

type UseHoverType<T extends HTMLElement> = [React.RefObject<T>, boolean]

export function useHover<T extends HTMLElement>(): UseHoverType<T> {
  const [value, setValue] = useState(false)

  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (node) {
      const handleMouseOver = () => setValue(true)
      const handleMouseOut = () => setValue(false)
      node.addEventListener('mouseover', handleMouseOver)
      node.addEventListener('mouseout', handleMouseOut)

      return () => {
        node.removeEventListener('mouseover', handleMouseOver)
        node.removeEventListener('mouseout', handleMouseOut)
      }
    }
  }, [])

  return [ref, value]
}

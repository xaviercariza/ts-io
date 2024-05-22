import { useEffect, useState } from 'react'

/**
 * useDebounce hook
 * This hook allows you to debounce any fast changing value. The debounced value will only
 * reflect the latest value when the useDebounce hook has not been called for the specified delay period.
 *
 * @param value - The value to be debounced.
 * @param delay - The delay in milliseconds for the debounce.
 * @returns The debounced value.
 */
function useDebounce<T>(value: T, delay: number): { debouncedValue: T } {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    if (typeof value === 'string' && value.trim().length === 0) {
      setDebouncedValue(value)
      return
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return { debouncedValue }
}

export { useDebounce }

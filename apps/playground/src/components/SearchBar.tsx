import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useOnClickOutside } from '../hooks/useOnClickOutside'
import { Spinner } from './Spinner'
import { useDebounce } from '../hooks/useDebounce'

export type Option = { key: string; label: string; value: string }

type Props<T extends Option> = {
  options: T[]
  onSearch: (search: string) => Promise<void>
  onSelect: (option: T) => void
}

export function SearchBar<T extends Option>({ options, onSearch, onSelect }: Props<T>) {
  const searchBarRef = useRef<HTMLDivElement | null>(null)
  const searchButtonRef = useRef<HTMLInputElement | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const debouncedValue = useDebounce(userSearch, 500)
  const [openSearch, setOpenSearch] = useState(false)
  const [searching, setSearching] = useState(false)
  useOnClickOutside(searchBarRef, () => setOpenSearch(false))

  useEffect(() => {
    async function searchUser(search: string) {
      setSearching(true)
      await onSearch(search)
      setSearching(false)
    }
    const value = debouncedValue.trim()
    if (value) {
      searchUser(value)
    }
  }, [debouncedValue, onSearch])

  const handleOpenSearch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setOpenSearch(true)
    searchButtonRef.current?.focus()
  }

  const handleUserSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value
    setUserSearch(search)
    setSearching(true)
  }

  const handleOptionClicked = (option: T) => () => {
    onSelect(option)
    setUserSearch('')
    setOpenSearch(false)
  }

  return (
    <div ref={searchBarRef} className="relative z-50">
      <button
        type="button"
        onClick={handleOpenSearch}
        className={`relative flex flex-col items-center justify-center rounded-full ${
          openSearch ? 'h-10 w-72' : 'h-10 w-10'
        } transition-all duration-500 ease-in-out border border-blue-400 overflow-hidden`}
      >
        <input
          ref={searchButtonRef}
          placeholder={openSearch ? 'Search...' : ''}
          value={userSearch}
          onChange={handleUserSearch}
          className="w-full h-full px-4 py-2 focus:outline-none focus:border-0 pr-10 hover:cursor-pointer placeholder:text-indigo-200 placeholder:font-medium text-indigo-400"
        />
        {searching ? (
          <Spinner className="absolute right-2" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-6 w-6 text-indigo-400 flex-shrink-0 absolute right-0 -translate-x-1/4"
          >
            <title>Search icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )}
      </button>
      {openSearch && userSearch.length >= 3 && !searching && (
        <ul className="z-50 absolute top-12 left-0 right-0 bg-white min-h-fit max-h-96 overflow-y-auto rounded-xl border border-indigo-400">
          {!options.length && <li className="py-2 px-4 text-gray-500">No results</li>}
          {!!options.length &&
            options.map((o, index) => (
              <li
                key={o.key}
                id={`product-${index}`}
                className="py-2 px-4 flex items-center justify-between gap-8 hover:bg-gray-100 cursor-pointer hover:cursor-pointer"
                onClick={handleOptionClicked(o)}
                onKeyDown={handleOptionClicked(o)}
              >
                <p className="font-normal text-indigo-400">{o.label}</p>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

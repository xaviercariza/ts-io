import type { Response } from '../types'

async function api<T>(url: string, options?: RequestInit): Promise<Response<T>> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const errorText = await res.text()
    return { success: false, error: errorText, code: res.status }
  }
  const json = (await res.json()) as T
  return { success: true, data: json }
}

export { api }

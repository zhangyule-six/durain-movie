import { ref } from 'vue'
import type { Ref } from 'vue'

export interface RequestOptions<TBody> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: TBody
  headers?: Record<string, string>
}

export interface RequestResult<TData> {
  data: Ref<TData | null>
  error: Ref<string | null>
  loading: Ref<boolean>
  execute: () => Promise<TData>
}

const API_BASE_URL='http://localhost:5001'

export function useRequest<TData = unknown, TBody = unknown>(
  options: RequestOptions<TBody>
): RequestResult<TData> {
  const data = ref(null) as Ref<TData | null>
  const error = ref(null) as Ref<string | null>
  const loading = ref(false) as Ref<boolean>

  const execute = async () => {
    loading.value = true
    error.value = null

    try {
      let url =
        options.url.startsWith('http') ? options.url : `${API_BASE_URL}${options.url}`

      const method = options.method ?? 'GET'
      if (method === 'GET' && options.body && typeof options.body === 'object') {
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(options.body as Record<string, unknown>)) {
          if (value === undefined || value === null) continue
          params.append(key, String(value))
        }
        const query = params.toString()
        if (query) url += (url.includes('?') ? '&' : '?') + query
      }

      const headers: Record<string, string> = {
        ...(options.headers || {})
      }

      const isAbsoluteUrl = /^https?:\/\//i.test(url)
      const credentials =
        options.url.startsWith('http') || isAbsoluteUrl ? 'omit' : 'include'

      const fetchInit: RequestInit = {
        method,
        headers,
        credentials
      }

      if (options.body !== undefined && fetchInit.method !== 'GET') {
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json'
        }
        fetchInit.body = JSON.stringify(options.body)
      }

      const res = await fetch(url, fetchInit)
      const resData = await res.json().catch(() => ({}))

      if (!res.ok) {
        const message = resData?.message || '请求失败'
        error.value = message
        throw new Error(message)
      }

      data.value = resData as TData
      return resData as TData
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    error,
    loading,
    execute
  }
}


import { ref } from 'vue'
import type { Ref } from 'vue'
import { getActiveToken } from '@/lib/accountStorage'

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

// 开发环境使用本地后端；生产环境使用同域相对路径（各 API 已以 `/api/...` 开头）
const API_BASE_URL =
  import.meta.env.DEV
    ? 'http://localhost:5001'
    : ''

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
      const isAbsoluteUrl = /^https?:\/\//i.test(options.url)
      let url = isAbsoluteUrl ? options.url : `${API_BASE_URL}${options.url}`

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
        ...options.headers
      }

      const activeToken = getActiveToken()
      const credentials: RequestCredentials =
        activeToken || isAbsoluteUrl ? 'omit' : 'include'
      if (activeToken) {
        headers['Authorization'] = 'Bearer ' + activeToken
      }

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


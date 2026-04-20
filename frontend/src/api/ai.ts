import { useRequest } from './http'
import { getActiveToken } from '@/lib/accountStorage'

const API_BASE_URL = 'http://localhost:5001'

export interface MovieRef {
  movieId?: string
  title: string
  poster?: string
}

export interface ConversationItem {
  _id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ConversationDetail {
  _id: string
  title: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    movieRefs: MovieRef[]
    createdAt: string
  }>
}

export interface SSEEvent {
  type: 'token' | 'tool_call' | 'movie_ref' | 'done' | 'error'
  data: Record<string, unknown>
}

export function useConversations() {
  return useRequest<ConversationItem[]>({
    url: '/api/ai/conversations',
    method: 'GET',
  })
}

export function useConversation(id: string) {
  return useRequest<ConversationDetail>({
    url: `/api/ai/conversations/${id}`,
    method: 'GET',
  })
}

export function useDeleteConversation(id: string) {
  return useRequest({
    url: `/api/ai/conversations/${id}`,
    method: 'DELETE',
  })
}

export async function sendChatMessage(
  message: string,
  conversationId: string | null,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal,
) {
  const token = getActiveToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, conversationId }),
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || '请求失败')
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('无法读取响应流')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    let currentEventType = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEventType = line.slice(7).trim()
      } else if (line.startsWith('data: ') && currentEventType) {
        try {
          const data = JSON.parse(line.slice(6))
          onEvent({ type: currentEventType as SSEEvent['type'], data })
        } catch {
          /* skip malformed JSON */
        }
        currentEventType = ''
      }
    }
  }
}

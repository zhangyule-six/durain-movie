import { ref, nextTick } from 'vue'
import {
  sendChatMessage,
  useConversations,
  type MovieRef,
  type ConversationItem,
  type ConversationDetail,
  type SSEEvent,
} from '@/api/ai'
import { useRequest } from '@/api/http'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  movieRefs: MovieRef[]
  isStreaming?: boolean
}

export interface ToolCallStatus {
  tool: string
  status: 'calling' | 'done' | 'error'
  args?: Record<string, unknown>
  resultCount?: number
  error?: string
}

const TOOL_LABELS: Record<string, string> = {
  search_wmdb: 'WMDB 影片库',
  search_maoyan: '猫眼电影',
  get_top_rated: '高分榜单',
  get_now_showing: '热映电影',
  get_coming_soon: '即将上映',
  ensure_movie: '本地数据库',
}

export function getToolLabel(name: string) {
  return TOOL_LABELS[name] || name
}

export function useAiChat() {
  const messages = ref<ChatMessage[]>([])
  const conversations = ref<ConversationItem[]>([])
  const currentConversationId = ref<string | null>(null)
  const isGenerating = ref(false)
  const toolCallStatus = ref<ToolCallStatus | null>(null)
  const abortController = ref<AbortController | null>(null)

  async function loadConversations() {
    const { execute } = useConversations()
    try {
      const data = await execute()
      conversations.value = data
    } catch {
      /* silent */
    }
  }

  async function loadConversation(id: string) {
    const { execute } = useRequest<ConversationDetail>({
      url: `/api/ai/conversations/${id}`,
      method: 'GET',
    })
    try {
      const data = await execute()
      messages.value = data.messages.map((m) => ({
        role: m.role,
        content: m.content,
        movieRefs: m.movieRefs || [],
      }))
      currentConversationId.value = id
    } catch {
      /* silent */
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isGenerating.value) return

    messages.value.push({
      role: 'user',
      content: text,
      movieRefs: [],
    })

    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: '',
      movieRefs: [],
      isStreaming: true,
    }
    messages.value.push(assistantMsg)
    isGenerating.value = true
    toolCallStatus.value = null

    const controller = new AbortController()
    abortController.value = controller

    try {
      await sendChatMessage(
        text,
        currentConversationId.value,
        (event: SSEEvent) => {
          const lastMsg = messages.value[messages.value.length - 1]
          if (!lastMsg || lastMsg.role !== 'assistant') return

          switch (event.type) {
            case 'token':
              lastMsg.content += (event.data as { content: string }).content || ''
              break
            case 'tool_call':
              toolCallStatus.value = event.data as ToolCallStatus
              break
            case 'movie_ref': {
              const ref = event.data as MovieRef
              if (!lastMsg.movieRefs.find((r) => r.title === ref.title)) {
                lastMsg.movieRefs.push(ref)
              }
              break
            }
            case 'done': {
              const d = event.data as { conversationId?: string; title?: string }
              if (d.conversationId) {
                currentConversationId.value = d.conversationId
              }
              lastMsg.isStreaming = false
              toolCallStatus.value = null
              break
            }
            case 'error':
              lastMsg.content += `\n\n> ⚠️ ${(event.data as { message: string }).message || '服务异常'}`
              lastMsg.isStreaming = false
              toolCallStatus.value = null
              break
          }
        },
        controller.signal,
      )
    } catch (err) {
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg?.role === 'assistant') {
        if ((err as Error).name === 'AbortError') {
          lastMsg.content += '\n\n> 已停止生成'
        } else {
          lastMsg.content += `\n\n> ⚠️ ${(err as Error).message || '请求失败'}`
        }
        lastMsg.isStreaming = false
      }
    } finally {
      isGenerating.value = false
      toolCallStatus.value = null
      abortController.value = null
      await nextTick()
      loadConversations()
    }
  }

  function stopGeneration() {
    abortController.value?.abort()
  }

  function startNewConversation() {
    currentConversationId.value = null
    messages.value = []
    toolCallStatus.value = null
  }

  async function deleteConversation(id: string) {
    const { execute } = useRequest({
      url: `/api/ai/conversations/${id}`,
      method: 'DELETE',
    })
    try {
      await execute()
      conversations.value = conversations.value.filter((c) => c._id !== id)
      if (currentConversationId.value === id) {
        startNewConversation()
      }
    } catch {
      /* silent */
    }
  }

  return {
    messages,
    conversations,
    currentConversationId,
    isGenerating,
    toolCallStatus,
    loadConversations,
    loadConversation,
    sendMessage,
    stopGeneration,
    startNewConversation,
    deleteConversation,
  }
}

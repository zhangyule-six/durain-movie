import { useRequest } from './http'

/** 接口返回的通知项 */
export interface NotificationApiItem {
  _id: string
  sender: { username: string; avatar?: string }
  type: 'like' | 'comment' | 'follow' | 'system'
  refType: 'review' | 'comment' | 'user' | 'system'
  refId?: string
  refContent?: string
  refTargetContent?: string
  isRead: boolean
  createdAt: string
}

/** 前端展示用的通知项 */
export type NotificationDisplayType = 'like' | 'reply'

export interface NotificationItem {
  id: string
  type: NotificationDisplayType
  isRead: boolean
  createdAt: number
  fromName: string
  fromAvatar: string
  /** 回复/评论内容（对方说的） */
  content: string
  /** 原影评/评论内容（被回复的） */
  targetContent: string
  targetTitle: string
}

export function mapApiToNotificationItem(api: NotificationApiItem): NotificationItem {
  const type: NotificationDisplayType = api.type === 'comment' ? 'reply' : 'like'
  const fallback =
    api.type === 'like'
      ? api.refType === 'comment'
        ? '赞了你的评论'
        : '赞了你的影评'
      : api.type === 'comment'
        ? '回复了你'
        : '通知了你'
  const trimmed = api.refContent?.trim() ?? ''
  const content = trimmed
    ? trimmed.slice(0, 80) + (trimmed.length > 80 ? '...' : '')
    : fallback
  const targetTrimmed = api.refTargetContent?.trim() ?? ''
  const targetContent = targetTrimmed
    ? targetTrimmed.slice(0, 60) + (targetTrimmed.length > 60 ? '...' : '')
    : ''
  const targetTitle =
    api.refType === 'review' ? '你的影评' : api.refType === 'comment' ? '你的评论' : '—'
  return {
    id: api._id,
    type,
    isRead: api.isRead,
    createdAt: new Date(api.createdAt).getTime(),
    fromName: api.sender?.username ?? '未知',
    fromAvatar: api.sender?.avatar ?? '',
    content,
    targetContent,
    targetTitle,
  }
}

export function useListNotifications(unreadOnly = false) {
  return useRequest<NotificationApiItem[], { unreadOnly?: boolean }>({
    url: '/api/notifications',
    method: 'GET',
    body: { unreadOnly: unreadOnly ? true : undefined },
  })
}

export function useMarkNotificationRead(id: string) {
  return useRequest<NotificationApiItem, undefined>({
    url: `/api/notifications/${id}/read`,
    method: 'POST',
  })
}

export function useMarkNotificationUnread(id: string) {
  return useRequest<NotificationApiItem, undefined>({
    url: `/api/notifications/${id}/unread`,
    method: 'POST',
  })
}

export function useMarkAllNotificationsRead() {
  return useRequest<{ success: boolean }, undefined>({
    url: '/api/notifications/read-all',
    method: 'POST',
  })
}

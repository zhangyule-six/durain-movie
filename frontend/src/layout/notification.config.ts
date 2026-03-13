export type NotificationType = 'like' | 'reply'

export interface NotificationItem {
  id: number
  type: NotificationType
  isRead: boolean
  createdAt: number
  fromName: string
  fromAvatar: string
  content: string
  targetTitle: string
}

const now = Date.now()

export const notificationMock: NotificationItem[] = [
  {
    id: 1,
    type: 'like',
    isRead: false,
    createdAt: now - 2 * 60 * 1000,
    fromName: 'MARCUX',
    fromAvatar: 'https://github.com/shadcn.png',
    content: '点赞了你的影评',
    targetTitle: '《DUNE: PART TWO》'
  },
  {
    id: 2,
    type: 'reply',
    isRead: false,
    createdAt: now - 15 * 60 * 1000,
    fromName: '沙漠拾光',
    fromAvatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    content: '回复了你的评论：太同意了！配乐真的炸裂。',
    targetTitle: '《DUNE: PART TWO》'
  },
  {
    id: 3,
    type: 'like',
    isRead: false,
    createdAt: now - 60 * 60 * 1000,
    fromName: '量子纠缠',
    fromAvatar: 'https://avatars.githubusercontent.com/u/2?v=4',
    content: '点赞了你的收藏',
    targetTitle: '《INTERSTELLAR》'
  },
  {
    id: 4,
    type: 'reply',
    isRead: true,
    createdAt: now - 3 * 60 * 60 * 1000,
    fromName: '用户名2',
    fromAvatar: 'https://github.com/shadcn.png',
    content: '回复了你的影评：二刷细节更多，真的神作。',
    targetTitle: '《盗梦空间》'
  },
  {
    id: 5,
    type: 'like',
    isRead: true,
    createdAt: now - 24 * 60 * 60 * 1000,
    fromName: '用户名5',
    fromAvatar: 'https://github.com/shadcn.png',
    content: '点赞了你的影评',
    targetTitle: '《疯狂动物城》'
  },
  {
    id: 6,
    type: 'reply',
    isRead: true,
    createdAt: now - 3 * 24 * 60 * 60 * 1000,
    fromName: '用户名1',
    fromAvatar: 'https://github.com/shadcn.png',
    content: '回复了你的评论：这个镜头语言确实很有趣。',
    targetTitle: '《星际穿越》'
  }
]


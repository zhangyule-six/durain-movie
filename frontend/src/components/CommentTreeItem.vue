<script setup lang="ts">
import { NAvatar, NButton } from 'naive-ui'

export interface CommentNode {
  _id: string
  author: { _id?: string; username: string; avatar?: string }
  replyToUser?: { username: string; avatar?: string } | null
  content: string
  createdAt: string
  likeCount: number
  children?: CommentNode[]
}

interface Props {
  node: CommentNode
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'reply', node: CommentNode): void
}>()

const handleReply = () => {
  emit('reply', props.node)
}
</script>

<template>
  <div class="border border-black/15 rounded-lg p-2.5 bg-white/90">
    <div class="flex items-start gap-2 mb-1">
      <NAvatar
        round
        :size="32"
        :src="node.author.avatar"
      />
      <div class="flex-1 flex flex-col min-w-0">
        <div class="flex items-center justify-between gap-2">
          <div class="text-xs font-bold truncate">
            {{ node.author.username }}
          </div>
          <div class="text-[11px] text-gray-500 shrink-0">
            {{ new Date(node.createdAt).toLocaleString() }}
          </div>
        </div>
        <div
          v-if="node.replyToUser"
          class="text-[11px] text-gray-500"
        >
          回复 @{{ node.replyToUser.username }}
        </div>
      </div>
    </div>

    <div class="text-xs text-gray-800 mb-2 leading-snug">
      {{ node.content }}
    </div>

    <div class="flex items-center justify-between text-[11px] text-gray-500">
      <div>点赞 {{ node.likeCount }}</div>
      <NButton text size="tiny" @click="handleReply">回复</NButton>
    </div>

    <div
      v-if="node.children && node.children.length"
      class="mt-2 pl-3 border-l-2 border-dashed border-black/20 flex flex-col gap-2"
    >
      <CommentTreeItem
        v-for="child in node.children"
        :key="child._id"
        :node="child"
        @reply="emit('reply', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NAvatar, NButton } from 'naive-ui'

export interface CommentNode {
  _id: string
  author: { username: string; avatar?: string }
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
  <div class="border rounded-md p-3 bg-gray-50">
    <div class="flex items-start gap-2 mb-1">
      <NAvatar
        round
        :size="32"
        :src="node.author.avatar"
      />
      <div class="flex-1 flex flex-col">
        <div class="flex items-center justify-between">
          <div class="text-sm font-bold">{{ node.author.username }}</div>
          <div class="text-[11px] text-gray-500">
            {{ new Date(node.createdAt).toLocaleString() }}
          </div>
        </div>
        <div
          v-if="node.replyToUser"
          class="text-xs text-gray-500"
        >
          回复 @{{ node.replyToUser.username }}
        </div>
      </div>
    </div>

    <div class="text-sm mb-2">
      {{ node.content }}
    </div>

    <div class="flex items-center justify-between text-xs text-gray-500">
      <div>点赞 {{ node.likeCount }}</div>
      <NButton text size="tiny" @click="handleReply">回复</NButton>
    </div>

    <div
      v-if="node.children && node.children.length"
      class="mt-3 pl-4 border-l border-dashed border-gray-300 flex flex-col gap-2"
    >
      <ReviewDialogCommentItem
        v-for="child in node.children"
        :key="child._id"
        :node="child"
        @reply="emit('reply', $event)"
      />
    </div>
  </div>
</template>




<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NAvatar,
  NButton,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NTabPane,
  NTabs
} from 'naive-ui'
import type { NotificationItem, NotificationType } from './notification.config'

interface Props {
  show: boolean
  items: NotificationItem[]
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  items: () => []
})

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'mark-read', id: number): void
  (e: 'mark-unread', id: number): void
}>()

const activeType = ref<NotificationType>('like')
const activeReadTab = ref<'unread' | 'read'>('unread')

const filteredSorted = computed(() => {
  const isRead = activeReadTab.value === 'read'
  return props.items
    .filter((i) => i.type === activeType.value)
    .filter((i) => i.isRead === isRead)
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
})

const formatTime = (ts: number) => {
  const d = new Date(ts)
  return d.toLocaleString()
}
</script>

<template>
  <NDrawer
    :show="show"
    placement="right"
    :width="380"
    :z-index="70"
    @update:show="(v) => emit('update:show', v)"
  >
    <NDrawerContent title="通知" closable>
      <div class="flex flex-col gap-4">
        <!-- 一级：点赞 / 回复 -->
        <NTabs v-model:value="activeType" type="line" animated>
          <NTabPane name="like" tab="点赞" />
          <NTabPane name="reply" tab="回复" />
        </NTabs>

        <!-- 二级：未读 / 已读 -->
        <NTabs v-model:value="activeReadTab" type="segment" animated>
          <NTabPane name="unread" tab="未读" />
          <NTabPane name="read" tab="已读" />
        </NTabs>

        <div class="flex flex-col gap-3">
          <div
            v-for="item in filteredSorted"
            :key="item.id"
            class="border-2 border-black rounded-2xl bg-white/80 p-3 flex gap-3"
          >
            <div class="pt-1">
              <span
                v-if="!item.isRead"
                class="inline-block w-2 h-2 rounded-full bg-red-500"
              />
              <span v-else class="inline-block w-2 h-2" />
            </div>

            <NAvatar
              :src="item.fromAvatar"
              :size="42"
              round
              class="border border-black shrink-0"
            />

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm font-extrabold truncate">
                  {{ item.fromName }}
                </div>
                <div class="text-[11px] text-gray-500 shrink-0">
                  {{ formatTime(item.createdAt) }}
                </div>
              </div>
              <div class="text-xs text-gray-700 mt-1 leading-snug">
                {{ item.content }}
              </div>
              <div class="text-xs font-semibold mt-1 truncate">
                {{ item.targetTitle }}
              </div>

              <div class="mt-2 flex justify-end">
                <NButton
                  v-if="!item.isRead"
                  size="tiny"
                  tertiary
                  @click="emit('mark-read', item.id)"
                >
                  标为已读
                </NButton>
                <NButton
                  v-else
                  size="tiny"
                  tertiary
                  @click="emit('mark-unread', item.id)"
                >
                  标为未读
                </NButton>
              </div>
            </div>
          </div>

          <NEmpty
            v-if="filteredSorted.length === 0"
            description="暂无通知"
          />
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>


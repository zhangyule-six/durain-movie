<script setup lang="ts">
import { computed } from 'vue'
import { NAvatar } from 'naive-ui'
import { getAccounts } from '@/lib/accountStorage'
import type { AuthUser } from '@/api/types'
import type { StoredAccount } from '@/lib/accountStorage'

const props = defineProps<{
  visible: boolean
  currentUser: AuthUser | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'switch-to', payload: { uid: string; token: string }): void
  (e: 'use-other'): void
}>()

// 展示所有账户：当前 + 可切换的。当前用户若未在 stored 中则补上，保证始终显示
const accounts = computed(() => {
  const stored = getAccounts()
  const seen = new Set<string>()
  const result: StoredAccount[] = []
  if (props.currentUser) {
    const cur = stored.find((a) => a.uid === props.currentUser!._id)
    result.push(
      cur ?? {
        uid: props.currentUser._id,
        token: '',
        username: props.currentUser.username,
        avatar: props.currentUser.avatar,
      }
    )
    seen.add(props.currentUser._id)
  }
  for (const a of stored) {
    if (!seen.has(a.uid)) {
      result.push(a)
      seen.add(a.uid)
    }
  }
  return result
})

const selectAccount = (account: StoredAccount) => {
  if (props.currentUser && account.uid === props.currentUser._id) return
  emit('switch-to', { uid: account.uid, token: account.token })
}

const isCurrent = (account: StoredAccount) =>
  props.currentUser && account.uid === props.currentUser._id

const handleUseOther = () => {
  emit('update:visible', false)
  emit('use-other')
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
    @click.self="handleClose"
  >
    <div
      class="w-[320px] bg-white rounded-2xl border-[3px] border-[#0a0a0a] shadow-[6px_6px_0_0_#0a0a0a] px-6 py-5"
    >
      <h2 class="text-xl font-bold mb-3">切换账户</h2>

      <div class="space-y-2 mb-4 max-h-[240px] overflow-y-auto">
        <div
          v-for="acc in accounts"
          :key="acc.uid"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-xl border-2 text-left',
            isCurrent(acc)
              ? 'border-[#0a0a0a] bg-gray-100 cursor-default'
              : 'border-[#0a0a0a] hover:bg-gray-100 cursor-pointer'
          ]"
          role="button"
          tabindex="0"
          @click="selectAccount(acc)"
          @keydown.enter="selectAccount(acc)"
        >
          <NAvatar
            round
            :src="acc.avatar ?? 'https://github.com/shadcn.png'"
            size="small"
          />
          <span class="font-medium flex-1">{{ acc.username ?? '未知用户' }}</span>
          <span v-if="isCurrent(acc)" class="text-xs text-gray-500 shrink-0">当前</span>
        </div>
      </div>

      <p v-if="!accounts.length" class="mb-4 text-sm text-gray-500">
        暂无已保存的账户，请先登录
      </p>

      <div class="flex flex-col gap-2">
        <button
          type="button"
          class="w-full px-4 py-2 rounded-full border-2 border-[#0a0a0a] bg-white hover:bg-gray-100 transition-colors"
          @click="handleUseOther"
        >
          使用其他账号登录
        </button>
        <button
          type="button"
          class="w-full px-4 py-2 rounded-full border-2 border-[#0a0a0a] bg-white hover:bg-gray-100 transition-colors"
          @click="handleClose"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

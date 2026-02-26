<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  apiBaseUrl?: string
}>()

const emit = defineEmits<{
  (e: 'signup-success', payload: { email: string }): void
}>()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')

const API_BASE_URL = computed(
  () => props.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
)

const validate = () => {
  if (!fullName.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = '请填写所有必填项'
    return false
  }
  if (password.value.length < 6) {
    errorMessage.value = '密码长度至少为 6 位'
    return false
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致'
    return false
  }
  return true
}

const signupRequest = async () => {
  const res = await fetch(`${API_BASE_URL.value}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      fullName: fullName.value,
      email: email.value,
      password: password.value,
    }),
  })

  const data = await res.json().catch(() => ({} as any))

  if (!res.ok) {
    throw new Error(data.message || '注册失败')
  }

  return data as {
    _id: string
    fullName: string
    email: string
  }
}

const logoutAfterSignup = async () => {
  await fetch(`${API_BASE_URL.value}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {
    // 忽略登出错误，只作为状态清理
  })
}

const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  errorMessage.value = ''

  try {
    const user = await signupRequest()

    await logoutAfterSignup()

    emit('signup-success', {
      email: user.email,
    })
  } catch (e: any) {
    errorMessage.value = e?.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label class="block text-sm font-medium mb-1">昵称</label>
      <input
        v-model="fullName"
        type="text"
        class="w-full px-3 py-2 rounded-lg border-2 border-[#0a0a0a] outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="请输入昵称"
      />
    </div>

    <div>
      <label class="block text-sm font-medium mb-1">邮箱</label>
      <input
        v-model="email"
        type="email"
        class="w-full px-3 py-2 rounded-lg border-2 border-[#0a0a0a] outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="请输入邮箱"
      />
    </div>

    <div>
      <label class="block text-sm font-medium mb-1">密码</label>
      <input
        v-model="password"
        type="password"
        class="w-full px-3 py-2 rounded-lg border-2 border-[#0a0a0a] outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="至少 6 位密码"
      />
    </div>

    <div>
      <label class="block text-sm font-medium mb-1">确认密码</label>
      <input
        v-model="confirmPassword"
        type="password"
        class="w-full px-3 py-2 rounded-lg border-2 border-[#0a0a0a] outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="再次输入密码"
      />
    </div>

    <p v-if="errorMessage" class="text-sm text-red-500">
      {{ errorMessage }}
    </p>

    <button
      type="submit"
      class="w-full mt-2 px-5 py-2 rounded-full border-2 border-[#0a0a0a] bg-green-400 hover:bg-green-500 transition-colors font-bold"
      :disabled="loading"
    >
      {{ loading ? '注册中...' : '注册' }}
    </button>
  </form>
</template>


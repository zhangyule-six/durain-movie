<script setup lang="ts">
import { ref } from 'vue'
import { useSignup, useLogout } from '@/api/auth'
import type { SignupPayload } from '@/api/types'

const emit = defineEmits<{
  (e: 'signup-success', payload: { email: string }): void
}>()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')

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

const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  errorMessage.value = ''

  const payload: SignupPayload = {
    username: fullName.value,
    email: email.value,
    password: password.value
  }

  const { execute, error } = useSignup(payload)

  try {
    const user = await execute()

    await useLogout().execute().catch(() => {})

    emit('signup-success', {
      email: user.email
    })
  } catch (e: any) {
    errorMessage.value =  e?.message || '注册失败，请稍后重试'
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


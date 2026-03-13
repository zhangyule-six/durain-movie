<script setup lang="ts">
import { ref } from 'vue'
import Signup from './signup.vue'
import { useLogin } from '@/api/auth'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'login-success', payload: { userName: string; avatarUrl?: string }): void
}>()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const mode = ref<'login' | 'signup'>('login')

const close = () => {
  if (loading.value) return
  emit('update:visible', false)
}

const switchToSignup = () => {
  errorMessage.value = ''
  successMessage.value = ''
  mode.value = 'signup'
}

const switchToLogin = () => {
  errorMessage.value = ''
  successMessage.value = ''
  mode.value = 'login'
}

const onSignupSuccess = (payload: { email: string }) => {
  email.value = payload.email
  password.value = ''
  successMessage.value = '注册成功，请使用该邮箱登录'
  errorMessage.value = ''
  mode.value = 'login'
}

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = '请输入邮箱和密码'
    return
  }

  const { execute, error } = useLogin({
    email: email.value,
    password: password.value
  })

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const user = await execute()

    emit('login-success', {
      userName: user.username,
      avatarUrl: user.avatar
    })
    emit('update:visible', false)
  } catch (_) {
    errorMessage.value = error || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    v-if="props.visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="close"
  >
    <div
      class="w-[360px] bg-white rounded-2xl border-[3px] border-[#0a0a0a] shadow-[6px_6px_0_0_#0a0a0a] px-6 py-6"
    >
      <div class="mb-4 flex items-baseline justify-between">
        <div>
          <h2 class="text-xl font-bold mb-1" style="font-family: 'Rounded', sans-serif;">
            {{ mode === 'login' ? '登录 Durian Movie' : '注册 Durian Movie' }}
          </h2>
          <p class="text-sm text-gray-500">
            {{ mode === 'login' ? '登录后可发布影评、收藏影片等更多操作' : '注册新账号，开启你的观影之旅' }}
          </p>
        </div>
      </div>

      <p v-if="successMessage" class="mb-2 text-sm text-green-600">
        {{ successMessage }}
      </p>

      <div v-if="mode === 'login'">
        <form class="space-y-4" @submit.prevent="handleSubmit">
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
              placeholder="请输入密码"
            />
          </div>

          <p v-if="errorMessage" class="text-sm text-red-500">
            {{ errorMessage }}
          </p>

          <div class="flex items-center justify-between mt-4">
            <button
              type="button"
              class="px-4 py-2 rounded-full border-2 border-[#0a0a0a] bg-white hover:bg-gray-100 transition-colors"
              @click="close"
            >
              取消
            </button>

            <button
              type="submit"
              class="px-5 py-2 rounded-full border-2 border-[#0a0a0a] bg-yellow-400 hover:bg-yellow-500 transition-colors font-bold"
              :disabled="loading"
            >
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </div>
        </form>

        <div class="mt-3 text-right text-sm">
          <button class="text-blue-600 hover:underline" type="button" @click="switchToSignup">
            没有账号？去注册
          </button>
        </div>
      </div>

      <div v-else>
        <Signup @signup-success="onSignupSuccess" />

        <div class="mt-3 text-right text-sm">
          <button class="text-blue-600 hover:underline" type="button" @click="switchToLogin">
            已有账号？去登录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


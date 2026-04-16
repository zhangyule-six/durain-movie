<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Signup from './signup.vue'
import SwitchAccountModal from './SwitchAccountModal.vue'
import { useLogin, useLogout, useCheckAuth } from '@/api/auth'
import type { AuthUser } from '@/api/types'
import { useUserStore } from '@/stores/useUser'
import {
  addAccount,
  setActiveAccount,
  removeAccount,
  getAccounts,
} from '@/lib/accountStorage'

const props = defineProps<{
  visible: boolean,
  mode: 'login' | 'signup'
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'login-success', payload: { userName: string; avatarUrl?: string } | null): void
}>()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const mode = ref<'login' | 'signup'>('login')

const currentUser = ref<AuthUser | null>(null)
const router = useRouter()
const userStore = useUserStore()
const showSwitchModal = ref(false)

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

  const { execute } = useLogin({
    email: email.value,
    password: password.value
  })

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const res = await execute() as AuthUser & { token?: string }
    currentUser.value = res
    userStore.setUser(res)
    if (res.token) {
      addAccount({
        uid: res._id,
        token: res.token,
        username: res.username,
        avatar: res.avatar,
      })
      setActiveAccount(res.token)
    }

    emit('login-success', {
      userName: res.username,
      avatarUrl: res.avatar
    })
    emit('update:visible', false)

    if (res.role === 'admin') {
      router.push('/admin/dashboard')
    }
  } catch (_) {
    errorMessage.value =  '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const refreshAuthState = async () => {
  const { execute } = useCheckAuth()
  try {
    const user = await execute()
    currentUser.value = user
    userStore.setUser(user)
  } catch {
    currentUser.value = null
    userStore.setUser(null)
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      refreshAuthState()
    }
  },
)

const handleLogout = async () => {
  const { execute } = useLogout()
  const wasAdmin = currentUser.value?.role === 'admin'
  loading.value = true
  try {
    await execute()
    if (currentUser.value?._id) {
      removeAccount(currentUser.value._id)
    }
    const remaining = getAccounts()
    setActiveAccount(remaining[0]?.token ?? null)
    if (remaining.length === 0) {
      currentUser.value = null
      userStore.setUser(null)
      emit('login-success', null)
    } else {
      const user = await useCheckAuth().execute()
      currentUser.value = user
      userStore.setUser(user)
      emit('login-success', { userName: user.username, avatarUrl: user.avatar })
    }
    emit('update:visible', false)
    if (wasAdmin) {
      router.push('/')
    }
  } finally {
    loading.value = false
  }
}

const handleSwitchTo = async (payload: { uid: string; token: string }) => {
  loading.value = true
  try {
    setActiveAccount(payload.token)
    const user = await useCheckAuth().execute()
    currentUser.value = user
    userStore.setUser(user)
    emit('login-success', { userName: user.username, avatarUrl: user.avatar })
    showSwitchModal.value = false
  } catch {
    currentUser.value = null
    userStore.setUser(null)
    emit('login-success', null)
  } finally {
    loading.value = false
  }
}

const handleUseOtherAccount = async () => {
  showSwitchModal.value = false
  const { execute } = useLogout()
  try {
    await execute()
  } catch {}
  setActiveAccount(null)
  currentUser.value = null
  userStore.setUser(null)
  emit('login-success', null)
  email.value = ''
  password.value = ''
}
</script>

<template>
  <!-- 未检测到已登录时，展示登录 / 注册表单 -->
  <div
    v-if="props.visible && !currentUser"
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
  <!-- 已登录时，展示退出登录面板（切换账户时关闭本面板，仅显示 SwitchAccountModal） -->
  <div
    v-else-if="props.visible && currentUser && !showSwitchModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="close"
  >
    <div
      class="w-[400px] bg-white rounded-2xl border-[3px] border-[#0a0a0a] shadow-[6px_6px_0_0_#0a0a0a] px-6 py-5"
    >
      <div class="mb-3">
        <h2 class="text-xl font-bold mb-1">已登录</h2>
        <p class="text-sm text-gray-500">
          当前账号：{{ currentUser.username }}
        </p>
      </div>
      <div class="flex items-center justify-end gap-3 mt-2">
        <button
          type="button"
          class="px-4 py-2 rounded-full border-2 border-[#0a0a0a] bg-white hover:bg-gray-100 transition-colors"
          @click="close"
        >
          关闭
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-full border-2 border-[#0a0a0a] bg-white hover:bg-gray-100 transition-colors"
          @click="showSwitchModal = true"
        >
          切换账户
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-full border-2 border-[#0a0a0a] bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
          :disabled="loading"
          @click="handleLogout"
        >
          {{ loading ? '退出中...' : '退出登录' }}
        </button>
      </div>
    </div>
  </div>

  <SwitchAccountModal
    :visible="showSwitchModal"
    :current-user="currentUser"
    @update:visible="(v) => (showSwitchModal = v)"
    @switch-to="handleSwitchTo"
    @use-other="handleUseOtherAccount"
  />
</template>

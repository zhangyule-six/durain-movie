<script setup lang="ts">
import { ref, h, onMounted, watch } from 'vue'
import {
  NDataTable,
  NInput,
  NTag,
  NButton,
  NPopconfirm,
  NSpin,
  NAvatar,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { Search } from 'lucide-vue-next'
import { useUserStore } from '@/stores/useUser'
import {
  useAdminUsers,
  useAdminUpdateRole,
  type AdminUser,
} from '@/api/admin'

const message = useMessage()
const userStore = useUserStore()

const loading = ref(false)
const data = ref<AdminUser[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function fetchUsers() {
  loading.value = true
  try {
    const { execute } = useAdminUsers({
      page: page.value,
      limit: pageSize.value,
      q: searchQuery.value || undefined,
    })
    const res = await execute()
    data.value = res.items
    total.value = res.pagination.total
  } catch {
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

function handlePageChange(p: number) {
  page.value = p
  fetchUsers()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  fetchUsers()
}

watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    fetchUsers()
  }, 300)
})

async function toggleRole(user: AdminUser) {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  try {
    const { execute } = useAdminUpdateRole(user._id, newRole)
    await execute()
    message.success(`已将 ${user.username} 设为 ${newRole === 'admin' ? '管理员' : '普通用户'}`)
    fetchUsers()
  } catch {
    message.error('修改角色失败')
  }
}

const columns: DataTableColumns<AdminUser> = [
  {
    title: '用户',
    key: 'user',
    render(row) {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(NAvatar, {
          src: row.avatar,
          round: true,
          size: 36,
          bordered: true,
          style: 'border-color: #0a0a0a; border-width: 2px',
        }),
        h('div', {}, [
          h('div', { class: 'font-bold text-[#0a0a0a] text-sm' }, row.username),
          h('div', { class: 'text-xs text-gray-400' }, row.email),
        ]),
      ])
    },
  },
  {
    title: '角色',
    key: 'role',
    width: 100,
    render(row) {
      return h(
        NTag,
        {
          type: row.role === 'admin' ? 'success' : 'default',
          round: true,
          bordered: true,
          size: 'small',
        },
        { default: () => (row.role === 'admin' ? '管理员' : '用户') },
      )
    },
  },
  {
    title: '注册时间',
    key: 'createdAt',
    width: 160,
    render(row) {
      return h('span', { class: 'text-sm text-gray-500' }, new Date(row.createdAt).toLocaleDateString('zh-CN'))
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 140,
    render(row) {
      const isSelf = userStore.user?._id === row._id
      if (isSelf) {
        return h('span', { class: 'text-xs text-gray-400' }, '当前账号')
      }
      const isAdmin = row.role === 'admin'
      return h(
        NPopconfirm,
        {
          onPositiveClick: () => toggleRole(row),
        },
        {
          trigger: () =>
            h(
              NButton,
              {
                size: 'small',
                type: isAdmin ? 'error' : 'info',
                secondary: true,
              },
              { default: () => (isAdmin ? '撤销管理员' : '设为管理员') },
            ),
          default: () =>
            `确定将 ${row.username} ${isAdmin ? '降级为普通用户' : '提升为管理员'}？`,
        },
      )
    },
  },
]
</script>

<template>
  <div style="font-family: 'Rounded', sans-serif">
    <h1 class="text-2xl font-extrabold text-[#0a0a0a] mb-6">用户管理</h1>

    <!-- Search -->
    <div class="mb-5">
      <div
        class="inline-flex items-center bg-white rounded-xl border-2 border-[#0a0a0a] px-4 py-2.5 w-80"
      >
        <Search class="w-5 h-5 text-gray-400 mr-3 shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索用户名或邮箱"
          class="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
        />
      </div>
    </div>

    <!-- Table -->
    <div
      class="rounded-2xl border-[3px] border-[#0a0a0a] bg-white overflow-hidden"
      style="box-shadow: 4px 4px 0 0 rgba(10, 10, 10, 1)"
    >
      <NSpin :show="loading">
        <NDataTable
          :columns="columns"
          :data="data"
          :row-key="(row: AdminUser) => row._id"
          :pagination="{
            page: page,
            pageSize: pageSize,
            itemCount: total,
            showSizePicker: true,
            pageSizes: [10, 20, 30],
            onUpdatePage: handlePageChange,
            onUpdatePageSize: handlePageSizeChange,
          }"
          :bordered="false"
          size="medium"
          remote
        />
      </NSpin>
    </div>
  </div>
</template>

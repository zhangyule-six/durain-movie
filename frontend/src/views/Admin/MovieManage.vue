<script setup lang="ts">
import { ref, h, onMounted, watch } from 'vue'
import {
  NDataTable,
  NButton,
  NPopconfirm,
  NSpin,
  NModal,
  NForm,
  NFormItem,
  NInput,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { Search } from 'lucide-vue-next'
import {
  useAdminMovies,
  useAdminUpdateMovie,
  useAdminDeleteMovie,
  type AdminMovie,
} from '@/api/admin'

const message = useMessage()

const loading = ref(false)
const data = ref<AdminMovie[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const showEditModal = ref(false)
const editForm = ref({
  _id: '',
  title: '',
  summary: '',
  country: '',
  genres: '',
})

async function fetchMovies() {
  loading.value = true
  try {
    const { execute } = useAdminMovies({
      page: page.value,
      limit: pageSize.value,
      q: searchQuery.value || undefined,
    })
    const res = await execute()
    data.value = res.items
    total.value = res.pagination.total
  } catch {
    message.error('获取电影列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchMovies)

function handlePageChange(p: number) {
  page.value = p
  fetchMovies()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  fetchMovies()
}

watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    fetchMovies()
  }, 300)
})

function openEdit(row: AdminMovie) {
  editForm.value = {
    _id: row._id,
    title: row.title || '',
    summary: row.summary || '',
    country: row.country || '',
    genres: row.genres?.join(', ') || '',
  }
  showEditModal.value = true
}

async function handleSaveEdit() {
  try {
    const genres = editForm.value.genres
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const { execute } = useAdminUpdateMovie(editForm.value._id, {
      title: editForm.value.title,
      summary: editForm.value.summary,
      country: editForm.value.country,
      genres,
    } as any)
    await execute()
    message.success('电影信息已更新')
    showEditModal.value = false
    fetchMovies()
  } catch {
    message.error('更新失败')
  }
}

async function handleDelete(row: AdminMovie) {
  try {
    const { execute } = useAdminDeleteMovie(row._id)
    await execute()
    message.success('电影已删除')
    fetchMovies()
  } catch {
    message.error('删除失败')
  }
}

const columns: DataTableColumns<AdminMovie> = [
  {
    title: '海报',
    key: 'poster',
    width: 70,
    render(row) {
      if (!row.poster) return h('div', { class: 'w-10 h-14 bg-gray-200 rounded' })
      return h('img', {
        src: row.poster,
        class: 'w-10 h-14 object-cover rounded border border-gray-300',
      })
    },
  },
  {
    title: '片名',
    key: 'title',
    ellipsis: { tooltip: true },
    render(row) {
      return h('span', { class: 'font-bold text-sm text-[#0a0a0a]' }, row.title)
    },
  },
  {
    title: '类型',
    key: 'genres',
    width: 160,
    ellipsis: { tooltip: true },
    render(row) {
      return h('span', { class: 'text-sm text-gray-500' }, row.genres?.join(' / ') || '-')
    },
  },
  {
    title: '评分',
    key: 'rating',
    width: 80,
    render(row) {
      const avg = row.rating?.average ?? 0
      return h('span', { class: 'text-sm font-bold text-[#f07050]' }, avg > 0 ? avg.toFixed(1) : '-')
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 120,
    render(row) {
      return h('span', { class: 'text-sm text-gray-500' }, new Date(row.createdAt).toLocaleDateString('zh-CN'))
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 160,
    render(row) {
      return h('div', { class: 'flex gap-2' }, [
        h(
          NButton,
          { size: 'small', type: 'info', secondary: true, onClick: () => openEdit(row) },
          { default: () => '编辑' },
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDelete(row) },
          {
            trigger: () =>
              h(NButton, { size: 'small', type: 'error', secondary: true }, { default: () => '删除' }),
            default: () => `确定删除「${row.title}」及其所有评论？`,
          },
        ),
      ])
    },
  },
]
</script>

<template>
  <div style="font-family: 'Rounded', sans-serif">
    <h1 class="text-2xl font-extrabold text-[#0a0a0a] mb-6">电影管理</h1>

    <!-- Search -->
    <div class="mb-5">
      <div
        class="inline-flex items-center bg-white rounded-xl border-2 border-[#0a0a0a] px-4 py-2.5 w-80"
      >
        <Search class="w-5 h-5 text-gray-400 mr-3 shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索电影名称"
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
          :row-key="(row: AdminMovie) => row._id"
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

    <!-- Edit Modal -->
    <NModal
      v-model:show="showEditModal"
      preset="card"
      title="编辑电影信息"
      :style="{ width: '500px' }"
      :bordered="true"
      :segmented="{ content: true, footer: true }"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="片名">
          <NInput v-model:value="editForm.title" placeholder="电影名称" />
        </NFormItem>
        <NFormItem label="简介">
          <NInput
            v-model:value="editForm.summary"
            type="textarea"
            placeholder="电影简介"
            :rows="4"
          />
        </NFormItem>
        <NFormItem label="国家/地区">
          <NInput v-model:value="editForm.country" placeholder="例如: 中国" />
        </NFormItem>
        <NFormItem label="类型">
          <NInput v-model:value="editForm.genres" placeholder="用逗号分隔，如: 剧情, 喜剧" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton @click="showEditModal = false">取消</NButton>
          <NButton type="primary" @click="handleSaveEdit">保存</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

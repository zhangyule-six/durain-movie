<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import {
  NDataTable,
  NButton,
  NPopconfirm,
  NSpin,
  NTag,
  NAvatar,
  NEllipsis,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import {
  useAdminReviews,
  useAdminDeleteReview,
  type AdminReview,
} from '@/api/admin'

const message = useMessage()

const loading = ref(false)
const data = ref<AdminReview[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

async function fetchReviews() {
  loading.value = true
  try {
    const { execute } = useAdminReviews({
      page: page.value,
      limit: pageSize.value,
    })
    const res = await execute()
    data.value = res.items
    total.value = res.pagination.total
  } catch {
    message.error('获取评论列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchReviews)

function handlePageChange(p: number) {
  page.value = p
  fetchReviews()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  fetchReviews()
}

async function handleDelete(row: AdminReview) {
  try {
    const { execute } = useAdminDeleteReview(row._id)
    await execute()
    message.success('评论已删除')
    fetchReviews()
  } catch {
    message.error('删除失败')
  }
}

const columns: DataTableColumns<AdminReview> = [
  {
    title: '作者',
    key: 'author',
    width: 140,
    render(row) {
      if (!row.author) return h('span', { class: 'text-gray-400 text-sm' }, '已删除用户')
      return h('div', { class: 'flex items-center gap-2' }, [
        h(NAvatar, {
          src: row.author.avatar,
          round: true,
          size: 28,
          bordered: true,
          style: 'border-color: #0a0a0a; border-width: 1px',
        }),
        h('span', { class: 'text-sm font-semibold text-[#0a0a0a]' }, row.author.username),
      ])
    },
  },
  {
    title: '电影',
    key: 'movie',
    width: 160,
    ellipsis: { tooltip: true },
    render(row) {
      return h(
        'span',
        { class: 'text-sm text-gray-600' },
        row.movie?.title ?? '未知电影',
      )
    },
  },
  {
    title: '评分',
    key: 'score',
    width: 60,
    render(row) {
      return h('span', { class: 'text-sm font-bold text-[#f07050]' }, row.score)
    },
  },
  {
    title: '内容',
    key: 'content',
    render(row) {
      return h(
        NEllipsis,
        { lineClamp: 2, style: 'max-width: 300px', tooltip: { width: 400 } },
        { default: () => row.content },
      )
    },
  },
  {
    title: '可见性',
    key: 'isPublic',
    width: 80,
    render(row) {
      return h(
        NTag,
        {
          type: row.isPublic ? 'success' : 'warning',
          size: 'small',
          round: true,
        },
        { default: () => (row.isPublic ? '公开' : '私密') },
      )
    },
  },
  {
    title: '时间',
    key: 'createdAt',
    width: 110,
    render(row) {
      return h(
        'span',
        { class: 'text-sm text-gray-500' },
        new Date(row.createdAt).toLocaleDateString('zh-CN'),
      )
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 90,
    render(row) {
      return h(
        NPopconfirm,
        { onPositiveClick: () => handleDelete(row) },
        {
          trigger: () =>
            h(
              NButton,
              { size: 'small', type: 'error', secondary: true },
              { default: () => '删除' },
            ),
          default: () => '确定删除该评论？此操作不可撤销。',
        },
      )
    },
  },
]
</script>

<template>
  <div style="font-family: 'Rounded', sans-serif">
    <h1 class="text-2xl font-extrabold text-[#0a0a0a] mb-6">评论管理</h1>

    <!-- Table -->
    <div
      class="rounded-2xl border-[3px] border-[#0a0a0a] bg-white overflow-hidden p-3"
      style="box-shadow: 4px 4px 0 0 rgba(10, 10, 10, 1)"
    >
      <NSpin :show="loading">
        <NDataTable
          :columns="columns"
          :data="data"
          :row-key="(row: AdminReview) => row._id"
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

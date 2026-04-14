<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useCreateGroup, useJoinGroup, useListGroups, type GroupItem } from '@/api/community'

const router = useRouter()
const message = useMessage()

const groups = ref<GroupItem[]>([])
const loading = ref(false)
const keyword = ref('')
const showCreate = ref(false)
const creating = ref(false)

const form = ref({
  name: '',
  description: '',
  tagsText: '',
})

async function fetchGroups() {
  loading.value = true
  try {
    const res = await useListGroups({ q: keyword.value, page: 1, limit: 30 }).execute()
    groups.value = res.items
  } catch (error: any) {
    message.error(error?.message || '加载小组失败')
  } finally {
    loading.value = false
  }
}

async function createGroup() {
  if (!form.value.name.trim()) {
    message.warning('请填写小组名称')
    return
  }
  creating.value = true
  try {
    const tags = form.value.tagsText
      .split(/[，,]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8)
    const created = await useCreateGroup({
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      tags,
    }).execute()
    message.success('小组创建成功')
    showCreate.value = false
    form.value = { name: '', description: '', tagsText: '' }
    await fetchGroups()
    router.push({ name: 'communityChat', params: { groupId: created._id } })
  } catch (error: any) {
    message.error(error?.message || '创建小组失败')
  } finally {
    creating.value = false
  }
}

async function joinGroup(item: GroupItem) {
  try {
    await useJoinGroup(item._id).execute()
    item.joined = true
    item.memberCount = Math.min(99, (item.memberCount || 0) + 1)
    message.success('加入成功')
  } catch (error: any) {
    message.error(error?.message || '加入失败')
  }
}

function enterGroup(item: GroupItem) {
  router.push({ name: 'communityChat', params: { groupId: item._id } })
}

onMounted(fetchGroups)
</script>

<template>
  <div class="relative box-border flex h-full min-h-0 flex-col overflow-hidden p-6 md:p-8">
    <div
      v-if="loading"
      class="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm text-[#6b7280]"
    >
      加载中...
    </div>
    <div class="mb-6 shrink-0 flex flex-wrap items-center gap-3">
      <n-input
        v-model:value="keyword"
        clearable
        placeholder="搜索小组（名称/简介）"
        class="max-w-[420px]"
        @keyup.enter="fetchGroups"
      />
      <n-button type="primary" :loading="loading" @click="fetchGroups">搜索</n-button>
      <n-button strong secondary @click="showCreate = true">新建小组</n-button>
    </div>

    <div class="min-h-0 flex-1">
      <div class="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="item in groups"
          :key="item._id"
          class="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
        >
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-lg font-bold text-[#1f2937]">{{ item.name }}</h3>
            <span class="text-xs text-[#6b7280]">{{ item.memberCount }}/99</span>
          </div>
          <p class="line-clamp-2 min-h-10 text-sm text-[#4b5563]">
            {{ item.description || '这个小组暂时还没有简介。' }}
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="tag in item.tags || []"
              :key="tag"
              class="rounded-full bg-[#eef2ff] px-2 py-1 text-xs text-[#4338ca]"
            >
              {{ tag }}
            </span>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <n-button v-if="!item.joined" size="small" :disabled="item.memberCount >= 99" @click="joinGroup(item)">
              加入
            </n-button>
            <n-button v-else type="primary" size="small" @click="enterGroup(item)">进入聊天</n-button>
          </div>
        </div>
      </div>
      <div
        v-if="!loading && groups.length === 0"
        class="mt-10 flex items-center justify-center text-sm text-[#9ca3af]"
      >
        暂无小组，试试创建一个吧
      </div>
    </div>

    <n-modal v-model:show="showCreate" preset="card" title="新建同好小组" style="width: 520px">
      <div class="space-y-3">
        <n-input v-model:value="form.name" placeholder="小组名称（2-40字）" />
        <n-input
          v-model:value="form.description"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 5 }"
          placeholder="小组简介（选填）"
        />
        <n-input v-model:value="form.tagsText" placeholder="标签（逗号分隔，例如：诺兰,港片）" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" :loading="creating" @click="createGroup">创建</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

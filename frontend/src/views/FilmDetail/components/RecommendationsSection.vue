<script setup lang="ts">
import type { RecommendByGenresItem } from '@/api/types'

interface Props {
  items: RecommendByGenresItem[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  title: '你或许想看看这些：',
})

const emit = defineEmits<{
  (e: 'select', rec: RecommendByGenresItem): void
}>()

const handleClick = (rec: RecommendByGenresItem) => {
  emit('select', rec)
}
</script>

<template>
  <section
    class="flex flex-col gap-4"
  >
    <div
      class="self-start px-5 py-2 rounded-full border-2 border-black bg-pink-500 text-white text-sm font-extrabold"
    >
      {{ title }}
    </div>

    <div  v-if="items.length" class="flex gap-4 overflow-x-auto pb-2">
      <div
        v-for="rec in items"
        :key="rec.id"
        class="w-40 shrink-0 cursor-pointer border-2 border-black rounded-3xl overflow-hidden bg-white/80 hover:-translate-y-1 hover:shadow-xl transition-transform"
        @click="handleClick(rec)"
      >
        <img
          :src="rec.poster"
          :alt="rec.title"
          class="w-full h-44 object-cover"
        />
        <div class="p-3 flex flex-col gap-1">
          <div class="text-xs font-extrabold truncate">
            {{ rec.title }}
          </div>
          <div
            v-if="rec.genres?.length"
            class="text-[10px] text-gray-500 truncate"
          >
            {{ rec.genres.join(' / ') }}
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-xl font-bold text-gray-500 text-center">暂无相关推荐</div>
  </section>
</template>


<script setup lang="ts">
import type { Recommendation } from '@/api/types'

interface Props {
  items: Recommendation[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  title: '你或许想看看这些：',
})

const emit = defineEmits<{
  (e: 'select', rec: Recommendation): void
}>()

const handleClick = (rec: Recommendation) => {
  emit('select', rec)
}
</script>

<template>
  <section
    v-if="items.length"
    class="flex flex-col gap-4"
  >
    <div
      class="self-start px-5 py-2 rounded-full border-2 border-black bg-pink-500 text-white text-sm font-extrabold"
    >
      {{ title }}
    </div>

    <div class="flex gap-4 overflow-x-auto pb-2">
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
          <div class="text-xs font-extrabold truncate text-center">
            {{ rec.title }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { Clapperboard, X } from 'lucide-vue-next'
import AiChatWindow from './AiChatWindow.vue'

const isOpen = ref(false)
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div v-if="isOpen" class="absolute bottom-[72px] right-0">
        <AiChatWindow @close="isOpen = false" />
      </div>
    </Transition>

    <button
      class="group h-14 w-14 rounded-full border-3 border-[#0a0a0a] flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      :class="isOpen
        ? 'bg-[#0a0a0a] text-white'
        : 'bg-[#f06050] text-white hover:bg-[#e04e3f]'"
      style="box-shadow: 3px 3px 0 0 rgba(10,10,10,1); font-family: 'Rounded', sans-serif;"
      @click="isOpen = !isOpen"
    >
      <X v-if="isOpen" class="h-6 w-6" />
      <Clapperboard v-else class="h-6 w-6 transition-transform group-hover:rotate-[-8deg]" />
    </button>
  </div>
</template>

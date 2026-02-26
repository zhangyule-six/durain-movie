<script setup lang="ts">
import NoticeBoard from './componets/NoticeBoard.vue'
import NewFilm from './componets/newFilm.vue'
import FilmRank from './componets/FIlmRank.vue'
</script>

<template>
  <div class=" h-full p-8 flex flex-col gap-8">
    <NoticeBoard />
    <NewFilm />
    <FilmRank />

  </div>
</template>

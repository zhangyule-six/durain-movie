<script setup lang="ts">
import { NMessageProvider } from 'naive-ui'
import Layout from './layout/Layout.vue'
</script>

<template>
  <NMessageProvider>
    <Layout>
      <RouterView />
    </Layout>
  </NMessageProvider>
</template>

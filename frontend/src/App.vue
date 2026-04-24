<script setup lang="ts">
import { NMessageProvider, NDialogProvider } from 'naive-ui'
import Layout from './layout/Layout.vue'
</script>

<template>
  <NMessageProvider>
    <NDialogProvider>
      <Layout>
        <RouterView />
      </Layout>
    </NDialogProvider>
  </NMessageProvider>
</template>

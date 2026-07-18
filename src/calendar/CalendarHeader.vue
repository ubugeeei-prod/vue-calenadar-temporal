<script setup lang="ts">
defineSlots<{
  default: () => unknown;
}>();
</script>

<template>
  <header data-vct="header">
    <slot />
  </header>
</template>

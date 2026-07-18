<script setup lang="ts">
import { useCalendarContext } from "./context";

const { level = 2 } = defineProps<{
  /** Heading level exposed to assistive technology. Default: 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}>();

defineSlots<{
  default: (props: { title: string }) => unknown;
}>();

const { calendar, ids } = useCalendarContext();
</script>

<template>
  <div :id="ids.title" data-vct="title" role="heading" :aria-level="level" aria-live="polite">
    <slot :title="calendar.title.value">{{ calendar.title.value }}</slot>
  </div>
</template>

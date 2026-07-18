<script setup lang="ts">
import { useCalendarContext } from "./context";

defineSlots<{
  default: () => unknown;
}>();

const { calendar } = useCalendarContext();

function onClick(): void {
  calendar.previous();
}
</script>

<template>
  <button
    type="button"
    data-vct="prev-button"
    :aria-label="calendar.messages.value.previous(calendar.view.value)"
    :disabled="!calendar.canGoPrevious.value"
    @click="onClick"
  >
    <slot>‹</slot>
  </button>
</template>

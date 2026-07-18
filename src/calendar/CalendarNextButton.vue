<script setup lang="ts">
import { useCalendarContext } from "./context";

defineSlots<{
  default: () => unknown;
}>();

const { calendar } = useCalendarContext();

function onClick(): void {
  calendar.next();
}
</script>

<template>
  <button
    type="button"
    data-vct="next-button"
    :aria-label="calendar.messages.value.next(calendar.view.value)"
    :disabled="!calendar.canGoNext.value"
    @click="onClick"
  >
    <slot>›</slot>
  </button>
</template>

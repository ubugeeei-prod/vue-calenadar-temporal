<script setup lang="ts">
import { useCalendarContext } from "./context";

defineSlots<{
  default: (props: { label: string }) => unknown;
}>();

const { calendar } = useCalendarContext();

function onClick(): void {
  calendar.goToToday();
}
</script>

<template>
  <button type="button" data-vct="today-button" @click="onClick">
    <slot :label="calendar.messages.value.today">{{
      calendar.messages.value.today
    }}</slot>
  </button>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";
import { useDatePickerContext } from "./context";

defineSlots<{
  default: (props: { formatted: string; open: boolean }) => unknown;
}>();

const { picker, ids, triggerElement } = useDatePickerContext();

const element = useTemplateRef<HTMLButtonElement>("trigger");

onMounted(() => {
  // Registered so the content's outside-click detection can ignore the trigger.
  triggerElement.value = element.value;
});

function onClick(): void {
  picker.toggle();
}
</script>

<template>
  <button
    ref="trigger"
    :id="ids.trigger"
    type="button"
    data-vct="date-picker-trigger"
    aria-haspopup="dialog"
    :aria-expanded="picker.open.value"
    :aria-controls="picker.open.value ? ids.dialog : undefined"
    :data-open="picker.open.value ? '' : undefined"
    :data-empty="picker.formattedValue.value === '' ? '' : undefined"
    @click="onClick"
  >
    <slot :formatted="picker.formattedValue.value" :open="picker.open.value">
      {{
        picker.formattedValue.value === ""
          ? picker.calendar.messages.value.chooseDate
          : picker.formattedValue.value
      }}
    </slot>
  </button>
</template>

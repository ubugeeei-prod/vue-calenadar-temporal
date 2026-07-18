<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from "vue";
import CalendarHeader from "../calendar/CalendarHeader.vue";
import CalendarNextButton from "../calendar/CalendarNextButton.vue";
import CalendarPrevButton from "../calendar/CalendarPrevButton.vue";
import CalendarTitle from "../calendar/CalendarTitle.vue";
import CalendarMonthView from "../month/CalendarMonthView.vue";
import { useRovingFocus } from "../shared/focus";
import { useDatePickerContext } from "./context";

defineSlots<{
  default: () => unknown;
}>();

const { picker, ids, triggerElement } = useDatePickerContext();

const content = useTemplateRef<HTMLElement>("content");
const roving = useRovingFocus(content);

// Reacting to the (possibly externally controlled) open state is inherently
// observational: focus dives into the grid on open and returns to the trigger
// on close, per the APG date-picker-dialog pattern.
watch(picker.open, (open, wasOpen) => {
  if (open) void roving.focusActive();
  else if (wasOpen) triggerElement.value?.focus();
});

function onPointerDownOutside(pointerEvent: PointerEvent): void {
  if (!picker.open.value) return;
  const target = pointerEvent.target;
  if (!(target instanceof Node)) return;
  if (content.value?.contains(target) === true) return;
  if (triggerElement.value?.contains(target) === true) return;
  picker.close();
}

onMounted(() => {
  document.addEventListener("pointerdown", onPointerDownOutside);
});
onUnmounted(() => {
  document.removeEventListener("pointerdown", onPointerDownOutside);
});

function onKeydown(keyboardEvent: KeyboardEvent): void {
  if (keyboardEvent.key !== "Escape") return;
  keyboardEvent.stopPropagation();
  picker.close();
}

function onFocusout(focusEvent: FocusEvent): void {
  const next = focusEvent.relatedTarget;
  if (!(next instanceof Node)) return;
  if (content.value?.contains(next) === true) return;
  if (triggerElement.value?.contains(next) === true) return;
  picker.close();
}
</script>

<template>
  <!-- A closed popup intentionally renders nothing, and the dialog handles
       Escape/focusout itself (APG date picker dialog). -->
  <!-- eslint-disable vue/no-root-v-if, a11y/no-static-element-interactions -->
  <div
    v-if="picker.open.value"
    ref="content"
    :id="ids.dialog"
    role="dialog"
    data-vct="date-picker-content"
    :aria-label="picker.calendar.messages.value.chooseDate"
    @keydown="onKeydown"
    @focusout="onFocusout"
  >
    <slot>
      <CalendarHeader>
        <CalendarPrevButton />
        <CalendarTitle />
        <CalendarNextButton />
      </CalendarHeader>
      <CalendarMonthView />
    </slot>
  </div>
  <!-- eslint-enable vue/no-root-v-if, a11y/no-static-element-interactions -->
</template>

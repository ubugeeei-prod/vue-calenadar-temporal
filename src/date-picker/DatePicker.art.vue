<script setup lang="ts">
import { Temporal } from "../temporal";
import DatePickerContent from "./DatePickerContent.vue";
import DatePickerRoot from "./DatePickerRoot.vue";
import DatePickerTrigger from "./DatePickerTrigger.vue";

defineArt("./DatePickerRoot.vue", {
  title: "Date picker",
  category: "Date picker",
  tags: ["date-picker", "dialog", "form"],
});

const today = Temporal.PlainDate.from("2026-07-18");
</script>

<art>
  <variant name="Single date" default>
    <DatePickerRoot :today="today" :initial-focused-date="today" locale="en-US">
      <DatePickerTrigger />
      <DatePickerContent />
    </DatePickerRoot>
  </variant>

  <variant name="Range">
    <DatePickerRoot
      :today="today"
      :initial-focused-date="today"
      selection-mode="range"
      locale="en-US"
    >
      <DatePickerTrigger />
      <DatePickerContent />
    </DatePickerRoot>
  </variant>

  <variant name="Multiple, Japanese">
    <DatePickerRoot
      :today="today"
      :initial-focused-date="today"
      selection-mode="multiple"
      locale="ja-JP"
    >
      <DatePickerTrigger />
      <DatePickerContent />
    </DatePickerRoot>
  </variant>

  <variant name="Bounded (this month only)">
    <DatePickerRoot
      :today="today"
      :initial-focused-date="today"
      :min-date="today.with({ day: 1 })"
      :max-date="today.with({ day: today.daysInMonth })"
      initial-open
      locale="en-US"
    >
      <DatePickerTrigger />
      <DatePickerContent />
    </DatePickerRoot>
  </variant>
</art>

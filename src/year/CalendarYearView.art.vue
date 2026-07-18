<script setup lang="ts">
import CalendarRoot from "../calendar/CalendarRoot.vue";
import { Temporal } from "../temporal";
import CalendarYearView from "./CalendarYearView.vue";

defineArt("./CalendarYearView.vue", {
  title: "Year view",
  category: "Views",
  tags: ["calendar", "year", "overview"],
});

const today = Temporal.PlainDate.from("2026-07-18");

const events = [
  {
    id: "launch",
    title: "Launch",
    start: Temporal.PlainDate.from("2026-03-14"),
  },
  { id: "conf", title: "Conf", start: Temporal.PlainDate.from("2026-07-14") },
  { id: "trip", title: "Trip", start: Temporal.PlainDate.from("2026-11-02") },
];
</script>

<art>
  <variant name="Default" default>
    <CalendarRoot
      :today="today"
      :initial-focused-date="today"
      :events="events"
      initial-view="year"
      locale="en-US"
    >
      <CalendarYearView />
    </CalendarRoot>
  </variant>

  <variant name="Japanese">
    <CalendarRoot
      :today="today"
      :initial-focused-date="today"
      :events="events"
      initial-view="year"
      locale="ja-JP"
    >
      <CalendarYearView />
    </CalendarRoot>
  </variant>
</art>

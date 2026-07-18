<script setup lang="ts">
import CalendarRoot from "../calendar/CalendarRoot.vue";
import { Temporal } from "../temporal";
import CalendarWeekView from "./CalendarWeekView.vue";

defineArt("./CalendarWeekView.vue", {
  title: "Week view",
  category: "Views",
  tags: ["calendar", "week", "time-grid", "events"],
});

const today = Temporal.PlainDate.from("2026-07-18");

const events = [
  {
    id: "offsite",
    title: "Team offsite",
    start: Temporal.PlainDate.from("2026-07-14"),
    end: Temporal.PlainDate.from("2026-07-16"),
  },
  {
    id: "kickoff",
    title: "Kickoff",
    start: Temporal.PlainDateTime.from("2026-07-15T09:00"),
    end: Temporal.PlainDateTime.from("2026-07-15T10:30"),
  },
  {
    id: "sync",
    title: "Design sync",
    start: Temporal.PlainDateTime.from("2026-07-15T09:30"),
    end: Temporal.PlainDateTime.from("2026-07-15T10:00"),
  },
  {
    id: "lunch",
    title: "Lunch",
    start: Temporal.PlainDateTime.from("2026-07-16T12:00"),
    end: Temporal.PlainDateTime.from("2026-07-16T13:00"),
  },
];
</script>

<art>
  <variant name="Full week" default>
    <CalendarRoot
      :today="today"
      :initial-focused-date="today"
      :events="events"
      initial-view="week"
      locale="en-US"
    >
      <CalendarWeekView :start-hour="7" :end-hour="21" />
    </CalendarRoot>
  </variant>

  <variant name="Working hours">
    <CalendarRoot
      :today="today"
      :initial-focused-date="today"
      :events="events"
      initial-view="week"
      locale="en-US"
    >
      <CalendarWeekView :start-hour="9" :end-hour="18" />
    </CalendarRoot>
  </variant>

  <variant name="Three-day (mobile)">
    <CalendarRoot
      :today="today"
      :initial-focused-date="today"
      :events="events"
      initial-view="week"
      locale="ja-JP"
    >
      <CalendarWeekView :days="3" :start-hour="8" :end-hour="20" />
    </CalendarRoot>
  </variant>
</art>

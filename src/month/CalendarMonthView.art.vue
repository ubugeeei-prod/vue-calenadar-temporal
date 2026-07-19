<script setup lang="ts">
import CalendarHeader from "../calendar/CalendarHeader.vue";
import CalendarNextButton from "../calendar/CalendarNextButton.vue";
import CalendarPrevButton from "../calendar/CalendarPrevButton.vue";
import CalendarRoot from "../calendar/CalendarRoot.vue";
import CalendarTitle from "../calendar/CalendarTitle.vue";
import CalendarTodayButton from "../calendar/CalendarTodayButton.vue";
import { Temporal } from "../temporal";
import CalendarMonthView from "./CalendarMonthView.vue";

defineArt("./CalendarMonthView.vue", {
  title: "Month view",
  category: "Views",
  tags: ["calendar", "month", "events"],
});

const today = Temporal.PlainDate.from("2026-07-18");

const events = [
  {
    id: "conf",
    title: "Design conference",
    start: Temporal.PlainDate.from("2026-07-14"),
    end: Temporal.PlainDate.from("2026-07-16"),
  },
  {
    id: "standup",
    title: "Standup",
    start: Temporal.PlainDateTime.from("2026-07-15T09:00"),
  },
  {
    id: "review",
    title: "Design review",
    start: Temporal.PlainDateTime.from("2026-07-15T13:00"),
  },
  {
    id: "retro",
    title: "Retro",
    start: Temporal.PlainDateTime.from("2026-07-15T17:00"),
  },
  {
    id: "trip",
    title: "Kyoto trip",
    start: Temporal.PlainDate.from("2026-07-24"),
    end: Temporal.PlainDate.from("2026-07-27"),
  },
];
</script>

<art>
  <variant name="Default" default>
    <CalendarRoot :today="today" :initial-focused-date="today" locale="en-US">
      <CalendarHeader>
        <CalendarTitle />
        <CalendarTodayButton />
        <CalendarPrevButton />
        <CalendarNextButton />
      </CalendarHeader>
      <CalendarMonthView />
    </CalendarRoot>
  </variant>

  <variant name="With events">
    <CalendarRoot
      :today="today"
      :initial-focused-date="today"
      :events="events"
      locale="en-US"
    >
      <CalendarMonthView :max-event-lanes="3" />
    </CalendarRoot>
  </variant>

  <variant name="Week numbers, Japanese">
    <CalendarRoot :today="today" :initial-focused-date="today" locale="ja-JP">
      <CalendarMonthView show-week-numbers fixed-week-count />
    </CalendarRoot>
  </variant>

  <variant name="Range selection">
    <CalendarRoot
      :today="today"
      :initial-focused-date="today"
      selection-mode="range"
      locale="en-US"
    >
      <CalendarMonthView />
    </CalendarRoot>
  </variant>

  <variant name="RTL (Arabic)">
    <CalendarRoot :today="today" :initial-focused-date="today" locale="ar-EG">
      <CalendarMonthView />
    </CalendarRoot>
  </variant>

  <variant name="Hebrew calendar">
    <CalendarRoot
      :today="today"
      :initial-focused-date="today"
      locale="he-IL"
      calendar="hebrew"
    >
      <CalendarMonthView />
    </CalendarRoot>
  </variant>

  <variant name="Japanese era (令和)">
    <CalendarRoot
      :today="today"
      :initial-focused-date="today"
      locale="ja-JP"
      calendar="japanese"
    >
      <CalendarMonthView />
    </CalendarRoot>
  </variant>

  <variant name="Islamic (Umm al-Qura)">
    <CalendarRoot
      :today="today"
      :initial-focused-date="today"
      locale="ar-SA-u-ca-islamic-umalqura"
    >
      <CalendarMonthView />
    </CalendarRoot>
  </variant>
</art>

# vue-calendar-temporal

Temporal-powered, headless-first calendar & date picker for Vue — month /
week (time grid) / year views, Google-Calendar-style event rendering, full
i18n/l10n, full a11y, SSR-safe, and shipped as both **vdom** and **Vapor**
builds.

- **Temporal all the way down** — every date is a `Temporal.PlainDate` (or
  friends), backed by [`temporal-polyfill-lite`](https://github.com/fabon-f/temporal-polyfill-lite)
  as a ponyfill: no global patching, native-`Temporal`-compatible.
- **Headless first** — components render minimal, semantic, `data-vct`-tagged
  markup with the full WAI-ARIA grid / date-picker-dialog patterns; slots
  expose everything. Opt-in stylesheets when you don't want to start from
  zero.
- **Tiny** — size-limit-enforced budgets, measured minified + brotli:
  `useCalendar` alone **2.1 kB**, the whole library **10 kB**, everything
  including the Temporal ponyfill **26 kB**. Per-module dist output means
  your bundler only takes what you import.
- **Type safety as API design** — the selection mode is a generic: with
  `selection-mode="range"` your `v-model` _is_ `{ start, end } | null`, at
  compile time. Custom event fields survive normalization fully typed.

## Install

```sh
vp add vue-calendar-temporal   # or: pnpm add / npm i / yarn add
```

## Quick start

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import {
  CalendarRoot,
  CalendarHeader,
  CalendarTitle,
  CalendarPrevButton,
  CalendarNextButton,
  CalendarTodayButton,
  CalendarMonthView,
  Temporal,
} from "vue-calendar-temporal";
// Opt-in styles (structure + glassmorphic default, light/dark automatic):
import "vue-calendar-temporal/style.css";

const selected = shallowRef<Temporal.PlainDate | null>(null);

const events = [
  {
    id: "trip",
    title: "Kyoto trip",
    start: Temporal.PlainDate.from("2026-07-24"),
    end: Temporal.PlainDate.from("2026-07-27"), // all-day, inclusive
  },
  {
    id: "sync",
    title: "Design sync",
    start: Temporal.PlainDateTime.from("2026-07-15T09:30"), // timed, 60 min default
  },
];
</script>

<template>
  <CalendarRoot v-model="selected" :events="events" locale="ja-JP">
    <CalendarHeader>
      <CalendarTitle />
      <CalendarTodayButton />
      <CalendarPrevButton />
      <CalendarNextButton />
    </CalendarHeader>
    <CalendarMonthView />
  </CalendarRoot>
</template>
```

Week and year views are drop-in swaps inside the same root:

```html
<CalendarWeekView :start-hour="7" :end-hour="21" />
<!-- time grid + all-day strip -->
<CalendarWeekView :days="3" />
<!-- rolling 3-day (mobile) -->
<CalendarYearView />
<!-- 12 mini months -->
```

### Date picker

```vue
<DatePickerRoot v-model="date" selection-mode="range" locale="ja-JP">
  <DatePickerTrigger />
  <DatePickerContent />  <!-- APG dialog: focus management, Esc, outside-click -->
</DatePickerRoot>
```

### Vapor Mode (Vue ≥ 3.6)

The package ships a Vapor-compiled twin of every component:

```ts
import { CalendarRoot, CalendarMonthView } from "vue-calendar-temporal/vapor";
```

Composables are runtime-agnostic and work in both worlds unchanged.

## Composables — the headless-est layer

Everything the components do is a thin binding over fully typed composables
you can use directly:

```ts
import {
  useCalendar,
  useMonthGrid,
  useCalendarEvents,
} from "vue-calendar-temporal";

const calendar = useCalendar({
  locale: "ja-JP",
  selectionMode: "range", // ⇒ calendar.selected: ComputedRef<DateRange | null>
});

const { grid, weekdays } = useMonthGrid(calendar);
const bound = useCalendarEvents(calendar, () => events);
```

`useCalendar` / `useDatePicker` / `useMonthGrid` / `useWeekGrid` /
`useYearGrid` / `useCalendarEvents` / `useNowIndicator`, plus the pure layer
underneath (`buildMonthGrid`, `layoutEventLanes`, `layoutTimeGridDay`, …) —
**every option, default, and contract is documented on the symbol itself**;
your editor's hover is the reference manual.

## Styling

Opt-in sheets, all inside `vct.*` cascade layers so plain user CSS always
wins. `style.css` = `base.css` + the glass theme; or pair `base.css` with
any theme:

| import                            | look                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `vue-calendar-temporal/style.css` | the one-liner: structure + **glass**                      |
| `…/styles/base.css`               | structure only — bring your own theme                     |
| `…/styles/themes/glass.css`       | glassmorphic: frosted translucent cards, deep soft shadow |
| `…/styles/themes/simple.css`      | quiet hairlines, near-zero shadow                         |
| `…/styles/themes/material.css`    | tonal surfaces, level-1 elevation, state layers           |
| `…/styles/themes/flat.css`        | no borders, no shadows — tint blocks only                 |
| `…/styles/themes/solid.css`       | 2px strokes, hard offset shadows, pop accent              |

Every theme is a token sheet over one shared shell: custom-property
overrides (`--vct-accent`, `--vct-radius`, `--vct-ease-out`, …) restyle any
of them. Dark mode follows **your app's** `color-scheme` — declare
`:root { color-scheme: light dark }` (system) or `dark` (forced) once and
every theme flips with correct contrast.
Headless usage: skip the CSS entirely and style the `data-vct="…"` /
`data-*` state attributes yourself.

## i18n / l10n

Locale drives everything: month/weekday/hour labels, numbering systems
(Arabic-Indic digits included), first day of week and weekend from CLDR,
RTL direction (arrow keys invert), `Intl.ListFormat`ted multi-selections.
UI strings live in a typed `CalendarMessages` catalog — override any subset,
or wire it to vue-i18n.

## Accessibility

APG grid pattern (roving tabindex, arrows / PageUp / PageDown / Shift /
Home / End / Enter), `aria-current` today, localized full-date +
event-count cell labels, `aria-live` title announcements, and the APG
date-picker-dialog focus contract. Keyboard users get the same range
preview pointer users do.

## SSR

No DOM access outside event handlers and `onMounted`; the current-time
indicator only starts ticking client-side. Pass `today` (and `locale` /
`timeZone`) for byte-identical server output — there's a test asserting it.

## Development

```sh
vp install
vp dev              # playground + Musea gallery at /__musea__
vp test             # unit (node) + browser (playwright) projects
vp run ready        # fmt → checks → tests → build
vp run size         # size-limit budgets
vp run release minor  # bump PR → auto-merge → tag → npm via OIDC
```

Every PR gets a deployed Musea gallery preview and a
[pkg.pr.new](https://pkg.pr.new) package automatically.

## License

[MIT](./LICENSE)

# Charts

Horizon renders metrics through a small set of chart kinds. This page describes each kind, the inputs it accepts, and how it behaves. For the dashboard/overview widget types that select these charts, see [Dashboard Widgets](dashboard-widgets.md).

## Time chart

**Used by:** `line` dashboard widget; ad-hoc embeds in feature pages.

**Renders:** Multi-series line chart.

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `series` | `Series[]` | required | One per line. |
| `height` | number | 180 | Fixed pixel height. |
| `unit` | string | — | Optional unit suffix in tooltips. |
| `accent` | string | `var(--sw-accent)` | CSS var or hex for the first series. Subsequent series cycle through the palette. |
| `format` | `int` \| `decimal` \| `compact` | — | Axis and tooltip number formatting. |

### `Series`

```ts
interface Series {
  label: string;
  data: Array<number | null>;
  yAxisIndex?: number;   // 0 = left (default), 1 = right
  unit?: string;
}
```

### Behavior

- Dual y-axis appears when any series has `yAxisIndex: 1`.
- Legend visible iff `series.length > 1`.
- Smooth lines with circle point markers.
- Tooltip is positioned so it does not clip near grid edges.
- **Synced crosshairs**: hovering broadcasts to peer time charts on the same page so they highlight the same time.
- Data-only updates animate smoothly; structure changes (series count, label set) do a full replace.

## Top list

**Used by:** `top` dashboard widget.

**Renders:** Sorted list with optional tab switcher.

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | `ReadonlyArray<DashboardTopItem>` | — | Single list mode. |
| `groups` | `ReadonlyArray<TopGroup>` | — | Multi-list mode (mutually exclusive with `items`). |
| `unit` | string | — | Widget-level unit suffix. |
| `color` | string | `var(--sw-accent)` | Bar color. |

### `TopGroup`

```ts
interface TopGroup {
  label: string;
  expression?: string;     // surfaced in tab tooltip
  unit?: string;           // per-tab unit override
  items: DashboardTopItem[];
}
```

### `DashboardTopItem`

```ts
interface DashboardTopItem {
  name: string;
  value: number | null;
}
```

### Layout

- Rank column (18 px) | name (flex) | value (auto).
- Background fill bar normalized to the maximum value (per tab in multi-list mode).
- Tabs shown when `groups.length > 1`.

## Alarms timeline

**Used by:** Alarms page (full timeline above the alarm table).

**Renders:** Per-minute stacked bar chart of firing + recovered alarms, with brush selection.

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `alarms` | `AlarmMessage[]` | required | Alarm messages to bucket. |
| `startTime` | number | required | Window start (ms). |
| `endTime` | number | required | Window end (ms). |
| `height` | number | 110 | Pixel height. |
| `selectedRange` | `{ startTime, endTime } \| null` | null | Current brush selection. |

### Emits

| Event | Payload | When |
|---|---|---|
| `select-time-range` | `{ startTime, endTime }` | Brush completed or pin flag clicked. |
| `clear-selection` | — | Empty area click or parent clears selection. |

### Behavior

- Two stacked series per minute bucket: firing (red), recovered (green).
- Pin flags on non-zero buckets with count labels.
- Brush (`lineX`) for range selection. Snaps to minute boundaries.
- Click on non-zero point → selects that single minute. Click on zero → clears selection.

## Sparkline

**Used by:** Inline tiles, sidebar mini-charts, layer service-list picker (when a column carries a trend).

**Renders:** Tiny inline trend line — lightweight enough to render dozens per page.

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `values` | `Array<number \| null>` | required | Data points. `null` = gap. |
| `width` | number | 56 | Internal coord width. |
| `height` | number | 14 | Internal coord height. |
| `color` | string | `var(--sw-accent)` | Line color. |
| `stroke` | number | 1.25 | Line width (px). |
| `fluid` | boolean | false | Stretch to container width. |
| `crosshairBucket` | number \| null | null | Shared hover index (for synced sparklines). |

### Emits

| Event | Payload | When |
|---|---|---|
| `bucket-hover` | bucket index | Pointer over the chart. |
| `bucket-leave` | — | Pointer leaves the chart. |

### Behavior

- Fallback single dot when fewer than 2 finite samples.
- Gap bridging on `null` entries (line breaks).
- No interactivity beyond hover broadcasting.

## Theming

Chart colors follow the active design theme. Per-chart accents default to the theme accent and update live when the theme is switched — no reload needed. Hex color strings are accepted for one-off cases (e.g. severity colors); prefer the theme accent for anything that should follow theming.

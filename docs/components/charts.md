# Charts

Horizon wraps all chart rendering in dedicated components. The widget primitives (overview + dashboard) delegate to these wrappers. Per project rule, **no view ever instantiates ECharts directly** — the wrappers own the lifecycle, handle theming, sync crosshairs, and tear down on unmount.

This page is for developers extending or troubleshooting the chart layer. End-users of the templating system do not need it; reach for [Dashboard Widgets](dashboard-widgets.md) instead.

## `TimeChart`

**Path:** `apps/ui/src/components/charts/TimeChart.vue`
**Used by:** `line` dashboard widget; ad-hoc embeds in feature pages.

**Renders:** Multi-series line chart via ECharts.

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
- Tooltip positioned via callback (appendToBody) so it does not clip near grid edges.
- **Synced crosshairs**: hover events broadcast to peer `TimeChart` instances on the same page via the shared chart hover bus.
- Fingerprinting: data-only updates animate smoothly; structure changes (series count, label set) do a full replace.

### Adding a new chart kind

Any new ECharts-backed visualization should land as a sibling component, not as a fork of `TimeChart`. Share the hover-bus subscription if it should participate in synced crosshairs.

## `TopList`

**Path:** `apps/ui/src/components/charts/TopList.vue`
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

## `AlarmsTimeline`

**Path:** `apps/ui/src/components/charts/AlarmsTimeline.vue`
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

## `Sparkline`

**Path:** `apps/ui/src/components/charts/Sparkline.vue`
**Used by:** Inline tiles, sidebar mini-charts, layer service-list picker (when a column carries a trend).

**Renders:** Tiny inline SVG. No ECharts, no animation — lightweight enough to render dozens per page.

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

## D3 components

Where ECharts is wrong (custom interactions, non-cartesian layouts), Horizon uses D3 wrappers under `apps/ui/src/components/charts/` named `Native*`. The same lifecycle rule applies — the composable owns mount, render, and tear-down; no view manipulates the DOM directly.

## Theming

All chart colors derive from the design token CSS (`apps/ui/src/assets/styles/tokens.css`). Per-chart accents take a CSS variable string (`var(--sw-accent)`) by default — the chart resolves to the token's current value at render time, which means a theme switch updates colors live without remount.

Hex strings are accepted for one-off cases (e.g. severity colors); prefer tokens for anything that should follow theming.

## Adding a new chart wrapper

1. Place under `apps/ui/src/components/charts/` (shared) or `apps/ui/src/features/<feature>/` (feature-scoped) per the layering rule.
2. Own the lifecycle: instantiate in `onMounted`, dispose in `onBeforeUnmount`. Never let the chart outlive its component.
3. Resolve theme tokens via `getComputedStyle(document.documentElement)` if you need numeric values; or pass CSS variable strings through directly when the chart supports them.
4. If the chart is time-series with hover semantics, subscribe to the shared hover bus so it joins synced crosshairs.
5. Add a license header (`.ts` and `.vue` files require one — see `.licenserc.yaml`).

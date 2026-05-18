# Dashboard Widgets

Four widget types render on per-layer dashboards. The renderer (`apps/ui/src/render/layer-dashboard/LayerDashboardsView.vue`) branches on `widget.type` and delegates to a small component per kind.

## Grid context

- 12-column grid (`grid-template-columns: repeat(12, minmax(0, 1fr))`).
- Row height 120 px (`grid-auto-rows`).
- Gap 10 px.
- `grid-auto-flow: dense` — gaps backfill with smaller widgets.
- `span` defaults to 4 (three widgets per row); `rowSpan` defaults to 1.
- Legacy 24-col coordinates: `w` halves to 12-col, `h / 8` becomes row count. Old templates keep working.
- Responsive collapse below 1100 px viewport.

## Common widget shape

```ts
interface DashboardWidget {
  id: string;
  title: string;
  tip?: string;
  type: 'card' | 'line' | 'top' | 'record';
  expressions: string[];
  expressionLabels?: string[];
  expressionUnits?: string[];
  expressionAxes?: number[];
  unit?: string;
  format?: 'int' | 'decimal' | 'compact';
  span?: number;
  rowSpan?: number;
  visibleWhen?: string;
  layerScope?: boolean;
}
```

| Field | Notes |
|---|---|
| `expressions[]` | MQE expressions. `card` typically uses one; `line` one-per-series; `top` one-per-tab. |
| `expressionLabels[]` | Used by `top` for tab labels and by `line` for legend names. |
| `expressionUnits[]` | Per-expression unit override (mixed-unit charts). |
| `expressionAxes[]` | `0` = left axis (default), `1` = right axis. |
| `unit` | Widget-level default. |
| `format` | `int`, `decimal`, `compact`. |
| `visibleWhen` | Predicate. `#entity.<key>` (hides the widget unless the named entity is selected) or `<metric> has value` (hides unless the metric returns data). |
| `layerScope` | Evaluate against the whole layer rather than the selected service. |

## `card`

**Renders:** Single scalar value with optional unit, formatted per `format`.

### When to use

The widget's MQE collapses to a single number. Detect by looking at the outermost MQE call: `latest(...)`, `max(...)`, `min(...)`, `avg(<plain-metric>)`, `sum(<plain-metric>)` are scalar-collapse functions.

A `line` widget with a scalar-shaped MQE renders a one-point chart, which is misleading. Use `card`.

### Example

```json
{
  "id": "error_rate",
  "title": "Error rate",
  "type": "card",
  "expressions": ["service_sla/100"],
  "unit": "%",
  "format": "decimal",
  "span": 3
}
```

## `line`

**Renders:** Multi-series line chart via the `TimeChart` component (ECharts wrapper).

### Multi-series

One series per expression in `expressions[]`. Labels from `expressionLabels[]` populate the legend.

```json
{
  "id": "latency",
  "title": "Latency percentiles",
  "type": "line",
  "expressions": [
    "service_percentile{p='50'}",
    "service_percentile{p='95'}",
    "service_percentile{p='99'}"
  ],
  "expressionLabels": ["P50", "P95", "P99"],
  "unit": "ms",
  "span": 6,
  "rowSpan": 2
}
```

### Dual y-axis

When any series has `yAxisIndex: 1`, the right axis appears. Use for mixed-unit charts where one series is throughput (rpm) and another is latency (ms).

```json
{
  "id": "traffic_vs_latency",
  "title": "Traffic vs P95",
  "type": "line",
  "expressions": ["service_cpm", "service_percentile{p='95'}"],
  "expressionLabels": ["Throughput", "P95"],
  "expressionUnits": ["rpm", "ms"],
  "expressionAxes": [0, 1],
  "span": 6,
  "rowSpan": 2
}
```

### Behavior

- Smooth lines with circle markers.
- Legend visible when more than one series; hidden for single series.
- Tooltip positioned via callback (appendToBody) so it does not clip near grid edges.
- **Synced crosshairs**: pointing at a time on this chart highlights the same time on every other `line` chart on the page.
- Fingerprinting: data-only updates (same structure, new values) animate smoothly. Structure changes do a full replace.

### When `line` is wrong

- MQE collapses to one number → use `card`.
- MQE returns a sorted list of (label, value) → use `top`.

## `top`

**Renders:** Sorted list. Rank + name + value with a background fill bar normalized to the maximum.

### Tabs

When `expressions[]` has multiple entries, a tab switcher above the list lets the operator flip between expressions (each tab is a separate sort). Labels from `expressionLabels[]`; units from `expressionUnits[]`.

### Example

```json
{
  "id": "top_apis",
  "title": "Top 20 APIs",
  "type": "top",
  "expressions": [
    "top_n(endpoint_cpm, 20, des)",
    "top_n(endpoint_resp_time, 20, des)",
    "top_n(endpoint_sla, 20, asc)"
  ],
  "expressionLabels": ["Traffic", "Slow", "Errors"],
  "expressionUnits": ["rpm", "ms", "%"],
  "span": 3,
  "rowSpan": 4
}
```

### Behavior

- Rows are clickable when the result includes an entity reference — typically navigates to the per-endpoint or per-instance drill-down.
- Bar fill normalized per-tab (each tab has its own max).
- Background color follows the layer accent.

### MQE requirements

The MQE must return a labeled list. `top_n(<metric>, N, <des|asc>)` is the canonical shape. `aggregate_labels(...)` can also produce list-shaped output.

## `record`

**Renders:** Tabular records. Used for "slow SQL", "slow statements", and similar list-of-records output.

### When to use

The data source returns a record set (rows × typed columns) rather than a numeric time series. Examples:

- Slow SQL statements with execution time, count, statement text.
- Slow gRPC calls with method name, latency, status code.

### Example

```json
{
  "id": "slow_sql",
  "title": "Slow SQL",
  "type": "record",
  "expressions": ["top_n(database_slow_statement, 20, des)"],
  "span": 6,
  "rowSpan": 4
}
```

### Behavior

- Renders as a dense table with column headers from the record's typed fields.
- Sort, filter, pagination handled in the component.

## Visibility predicates

`visibleWhen` lets a widget hide itself based on context:

- `#entity.serviceInstance` — only show when an instance is selected. Useful for "instance details" widgets on the service page that should not render at the service-only level.
- `#entity.endpoint` — only show when an endpoint is selected.
- `<metric-name> has value` — only show when the named metric returns non-null data. Useful for layer-conditional widgets (e.g. JVM metrics only on JVM-based services).

The predicate is evaluated on every data refresh; the widget disappears (rather than rendering empty) when the predicate is false.

## Layer scope

`layerScope: true` runs the MQE against the layer rather than the currently selected service. Useful for layer-wide summaries on the service page (e.g., "this service" + "all services in this layer" side by side).

```json
{
  "id": "layer_total_rpm",
  "title": "Layer total RPM",
  "type": "card",
  "expressions": ["sum(service_cpm)"],
  "layerScope": true,
  "unit": "rpm",
  "span": 3
}
```

## Choosing the right widget

| MQE outermost call | Widget type |
|---|---|
| `latest(...)`, `max(...)`, `min(...)`, `avg(<plain>)`, `sum(<plain>)` | `card` |
| `rate(...)`, `increase(...)`, `relabels(...)`, `aggregate_labels(...)` without scalar collapse, `histogram*(...)` | `line` |
| `top_n(...)` returning labeled list | `top` |
| Record-shaped output (slow SQL, slow gRPC) | `record` |

The widget editor (planned) will warn on type / MQE mismatches. The schema does not enforce — author carefully.

## Per-scope widget sets

The `dashboards.<scope>` map on a layer template lets you define different widget grids for service / instance / endpoint / topology / trace / logs / profiling pages. Scope resolution falls back to `service` if a specific scope is unset (`apps/bff/src/logic/layers/loader.ts:widgetsForScope()`).

See [Customization → Layer Dashboard Templates](../customization/layer-templates.md) for the per-scope structure.

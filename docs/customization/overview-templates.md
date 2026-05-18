# Overview Templates

An **overview template** is a JSON file describing a war-room / cross-cutting dashboard composed from MQE-driven widgets on a 12-column grid. Overviews are independent of any single layer and are designed for the operator's "is everything OK?" pane.

Bundled templates: `apps/bff/src/bundled_templates/overviews/<id>.json`. Examples:

- `services.json` — cross-layer service health + Kubernetes capacity summary.
- `mesh.json` — Istio data-plane services + pilot activity + Kubernetes.

## Top-level shape

```json
{
  "id": "services",
  "title": "Service Health",
  "description": "Cross-layer service traffic, latency, errors, and capacity.",
  "visibility": "public",
  "icon": "services",
  "order": 1,
  "layers": ["GENERAL", "MESH", "K8S_SERVICE"],
  "widgets": [
    { "type": "section-break", "title": "Service traffic", "cols": 12 },
    { ... metric widget ... },
    { ... kpi-tile ... },
    { "type": "section-break", "title": "Cluster capacity", "cols": 6 },
    { ... metric-composite ... }
  ]
}
```

## Top-level fields

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | string | **required** | Stable id, used in the route `/overview/:id`. |
| `title` | string | **required** | Display title in the sidebar and page header. |
| `description` | string | — | One-line description shown under the title. |
| `visibility` | `public` \| `operate` | `public` | Sidebar placement. `operate` puts the overview under the Operate group (admin-only by convention). |
| `icon` | string | — | Sidebar icon name (from the icon set in `apps/ui/src/assets/icons/`). |
| `order` | number | — | Sort order within the visibility bucket (lower = earlier). |
| `layers` | string[] | — | Layer enums this overview aggregates. Optional — used as a hint by the sidebar and by widgets that want a default layer for MQE evaluation. |
| `widgets` | array | **required** | Ordered widget list. The renderer iterates and lays out per the grid model. |

## Widget types

Six supported `type` values:

| Type | Renders |
|---|---|
| `metric` | Single MQE scalar with optional unit. |
| `topology` | Service-map snapshot for the configured layer. |
| `section-break` | Visual row header; carries `cols` to override the grid column count for following widgets. |
| `kpi-tile` | Compound tile: optional service count + N KPI rows. |
| `alarms` | Active-alarm rail (60 min window). |
| `metric-composite` | Mixed KPI grid — number tiles + progress-bar rows. |

See [Components → Overview Widgets](../components/overview-widgets.md) for the per-widget detail.

## Grid model

The renderer (`apps/ui/src/render/overview/OverviewDashboardView.vue`) uses a CSS grid:

- Per-section column count, default 12, set by the most recent `section-break.cols`.
- Fixed row height 72 px.
- Per-widget `span` (column width, 1–12) and `rowSpan` (row height, 1–8).
- Gap 12 px between widgets.
- Single-column responsive collapse below 1100 px viewport.

The 72 px row height is tuned for KPI tile content; widgets that need more vertical space (a small chart, a multi-row composite) use `rowSpan: 2` or `rowSpan: 3`.

## Widget shape (common fields)

```ts
interface OverviewWidget {
  id: string;
  title: string;
  tip?: string;
  layer?: string;
  type: 'metric' | 'topology' | 'section-break' | 'kpi-tile' | 'alarms' | 'metric-composite';
  span?: number;            // 1–12
  rowSpan?: number;         // 1–8
  // type-specific fields below
  mqe?: string;             // metric
  unit?: string;            // metric
  aggregation?: 'sum' | 'avg'; // metric
  cols?: number;            // section-break
  kpis?: OverviewKpi[];     // kpi-tile, metric-composite
  showCount?: boolean;      // kpi-tile
  limit?: number;           // alarms
}
```

| Field | Notes |
|---|---|
| `id` | Unique within the dashboard. |
| `title` | Card title (not used by `section-break` — uses `title` as the section header). |
| `tip` | Optional one-line hover hint next to the title. |
| `layer` | Layer key (UPPER_SNAKE). Used to scope MQE evaluation. Optional for `section-break` and `alarms` (alarms can scope server-side if the layer is set). |
| `span` | Column span. Defaults vary per widget type. |
| `rowSpan` | Row span. Defaults vary per widget type. |

## `OverviewKpi`

Used by `kpi-tile` and `metric-composite`:

```ts
interface OverviewKpi {
  label: string;
  mqe?: string;
  unit?: string;
  aggregation?: 'sum' | 'avg';
  style?: 'number' | 'progress-bar';
  max?: number;
  source?: 'mqe' | 'service-count';
}
```

| Field | Notes |
|---|---|
| `label` | Row label. |
| `mqe` | Required when `source === 'mqe'` (the default). |
| `unit` | Unit suffix. |
| `aggregation` | `sum` for throughput / count; `avg` for ratios and rates. |
| `style` | `number` (default) or `progress-bar`. |
| `max` | Required when `style === 'progress-bar'` — the 100% value. |
| `source` | `mqe` (default) or `service-count` — the latter reads the layer's service count from the menu response instead of evaluating MQE. |

## Worked examples

### `metric` widget

```json
{
  "id": "total_rpm",
  "title": "Total RPM",
  "type": "metric",
  "layer": "GENERAL",
  "mqe": "sum(service_cpm)",
  "unit": "rpm",
  "aggregation": "sum",
  "span": 3,
  "rowSpan": 1
}
```

Single scalar tile. The MQE collapses to one number (here, `sum` over the time window).

### `kpi-tile` with service count + two KPIs

```json
{
  "id": "general_summary",
  "title": "General services",
  "type": "kpi-tile",
  "layer": "GENERAL",
  "showCount": true,
  "span": 4,
  "rowSpan": 3,
  "kpis": [
    {
      "label": "Apdex",
      "mqe": "avg(service_apdex/10000)",
      "aggregation": "avg",
      "style": "progress-bar",
      "max": 1
    },
    {
      "label": "P95",
      "mqe": "avg(service_percentile{p='95'})",
      "unit": "ms",
      "aggregation": "avg"
    }
  ]
}
```

`showCount: true` adds a service-count header row above the KPIs.

### `metric-composite` — mixed number + bar grid

```json
{
  "id": "k8s_summary",
  "title": "Cluster capacity & utilisation",
  "type": "metric-composite",
  "layer": "K8S",
  "span": 12,
  "rowSpan": 3,
  "kpis": [
    { "label": "Nodes", "mqe": "latest(k8s_cluster_node_total)", "aggregation": "avg" },
    { "label": "Pods",  "mqe": "latest(k8s_cluster_pod_total)",  "aggregation": "avg" },
    { "label": "CPU",
      "mqe": "k8s_cluster_cpu_cores_requests / k8s_cluster_cpu_cores * 100",
      "unit": "%", "aggregation": "avg",
      "style": "progress-bar", "max": 100 },
    { "label": "Memory",
      "mqe": "k8s_cluster_memory_requests / k8s_cluster_memory * 100",
      "unit": "%", "aggregation": "avg",
      "style": "progress-bar", "max": 100 }
  ]
}
```

The widget auto-splits KPIs:

- `number`-style KPIs (Nodes, Pods) go into the count-tile row (auto-fit, min 100 px).
- `progress-bar`-style or `unit === '%'` KPIs go into the bar grid (auto-fit, min 180 px).

This single widget replaces what used to be three separate hand-crafted widgets (`k8s-service-count`, `pilot`, `service-count`) — anything compound now goes through `metric-composite`.

### `section-break` to start a new row

```json
{ "type": "section-break", "title": "Cluster capacity", "cols": 6 }
```

Following widgets render in a **6-column** grid (rather than 12) until the next `section-break`. Used for paired side-by-side panes.

### `alarms` rail

```json
{
  "id": "active_alarms",
  "title": "Active alarms (60 min)",
  "type": "alarms",
  "layer": "GENERAL",
  "limit": 10,
  "span": 4,
  "rowSpan": 4
}
```

Read-only — Horizon does not support acknowledge / close / silence operations. Alarm recovery is backend-automatic.

## Admin editor

Overview templates are editable at runtime via `/admin/overview-templates` (verb `overview:write`). The editor:

- Lists all bundled overviews + any added ones, with widget count and editable flag.
- For each overview, shows the widget array with per-widget controls.
- **Type-aware editor**: per `widget.type`, only the relevant fields are exposed:

  | Type | Fields shown |
  |---|---|
  | `section-break` | `title`, `cols` |
  | `metric` | `layer`, `title`, `tip`, `mqe`, `unit`, `aggregation`, `span`, `rowSpan` |
  | `topology` | `layer`, `title`, `tip`, `span`, `rowSpan` |
  | `alarms` | `layer`, `title`, `tip`, `limit`, `span`, `rowSpan` |
  | `kpi-tile` | `layer`, `title`, `tip`, `showCount`, KPI rows (add / remove), `span`, `rowSpan` |
  | `metric-composite` | `layer`, `title`, `tip`, KPI rows (mixed MQE + service-count source), `span`, `rowSpan` |

- **Add / remove widgets** with the type picker.
- **Preview** renders the in-progress template against live OAP data.

Changes go through `POST /api/admin/overview-templates/:id`, validated server-side before being written.

## HTTP API

| Method | Path | Verb | Notes |
|---|---|---|---|
| GET | `/api/admin/overview-templates` | `overview:read` | List all overviews. |
| GET | `/api/admin/overview-templates/:id` | `overview:read` | Full config. |
| POST | `/api/admin/overview-templates/:id` | `overview:write` | Replace config. Validated, cache invalidated on write. |
| DELETE | `/api/admin/overview-templates/:id` | `overview:write` | Remove overview. |

The view route `/overview/:id` calls `GET /api/overview/:id/data` (verb `metrics:read`) which evaluates the widgets server-side and returns the resolved value set.

## Hot reload

Bundled file changes require a BFF restart (templates are loaded at startup). Admin-API edits go through the cache and apply on the next data fetch — no restart needed.

## Common patterns

### A war-room single-screen view

One overview, `id: war-room`, with `layers: [ALL_YOUR_LAYERS]`, and:

1. `section-break` "Health" + 4 × `kpi-tile` (one per critical layer with service-count + RPS / error-rate KPIs).
2. `section-break` "Alarms" + 1 × `alarms` widget (span 12) showing every firing alarm.
3. `section-break` "Capacity" + 1 × `metric-composite` (span 12) with cluster capacity.

Layout fits a 1440 px display above the fold; works on a wall projector at 1920 px.

### A team-specific overview

`visibility: operate`, only granted to the team's role via `landingByRole`:

```yaml
landingByRole:
  payments-on-call: /overview/payments
```

The team lands directly on their own overview after login.

### Replacing the old k8s / pilot / service-count widgets

Use `metric-composite` with one widget per cluster summary. The old per-feature widget types are no longer rendered — `metric-composite` is the unified shape.

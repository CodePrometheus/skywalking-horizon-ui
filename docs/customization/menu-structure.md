# Menu Structure

The Horizon sidebar is **composed from active OAP layers**, not hand-written. There is no "edit sidebar items" page — what shows up in the sidebar is a function of:

1. Which layers OAP currently exposes via `listLayers`.
2. The bundled per-layer JSON templates (`apps/bff/src/bundled_templates/layers/<key>.json`).
3. Per-user preferences (landing order, visibility toggles) held in the setup store.

This page documents how those three combine into the live sidebar.

## Data flow

```
OAP                       BFF                              UI
─────────────────────     ──────────────────────────────   ────────────────────
listLayers                                                 
listServices(layer)       /api/menu                        useLayers()
listLayerLevels       →   merge with                  →    useLandingOrder()
getMenuItems              bundled_templates/layers/        AppSidebar.vue
                          <key>.json
```

1. **OAP discovery.** The BFF calls the four GraphQL queries on every `/api/menu` hit. Layers reported by `listLayers` are "active".
2. **Template merge.** For each active layer, the BFF loads `bundled_templates/layers/<key>.json` (or applies defaults if absent) and merges OAP-provided data with template-provided cosmetics: `alias`, `color`, `group`, `visibility`, `caps`, `slots`, `header`, `overview`, `log`, `traces`, `naming`, `documentLink`.
3. **Counts.** For each layer, `listServices(layer)` is called to get the service count. The count is `-1` if OAP is unreachable.
4. **UI hydration.** The UI receives a `MenuResponse` with the layer list and renders the sidebar via `useLayers` (which layers exist) and `useLandingOrder` (in what order).

## The `MenuResponse` shape

`packages/api-client/src/menu.ts`:

```ts
interface MenuResponse {
  layers: LayerDef[];
  generatedAt: number;
  oap: { reachable: boolean; queryUrl: string; error?: string };
}

interface LayerDef {
  key: string;                          // OAP layer enum (UPPER_SNAKE)
  name: string;                         // Display name from OAP
  color: string;                        // Sidebar accent (hex or CSS var)
  serviceCount: number;                 // From listServices; -1 if OAP unreachable
  active: boolean;                      // True iff returned by listLayers
  group?: string;                       // Sidebar grouping label
  visibility?: 'public' | 'operate';    // Section placement
  normal?: boolean | null;              // Affects MQE scope (per OAP)
  level: number | null;                 // From listLayerLevels (sort hint)
  documentLink?: string;                // External docs URL
  slots: LayerSlots;                    // Entity term overrides
  caps: LayerCaps;                      // Feature toggles
  header?: LayerHeaderConfig;           // Service-list picker columns
  overview?: LayerOverviewConfig;       // Overview tile config
  log?: LogConfig;                      // Logs tab scope
  traces?: { source?: 'native' | 'zipkin' | 'both' };
  naming?: ServiceNamingRule;
}
```

## Sidebar sections

The sidebar has two main sections + the static Operate group:

### Layers

Active, public layers (`visibility: 'public'`, `serviceCount > 0`). Sorted by:

1. `useLandingOrder` — per-user `landing.priority` from the setup store.
2. Falls back to `level` from `listLayerLevels` when no user priority is set.

A layer with `serviceCount === 0` is hidden from the Layers section but still available for the admin's setup screen ("enable this layer when services appear").

### Operate (per-layer, optional)

Layers with `visibility: 'operate'` go under the Operate group instead of Layers. Used for self-observability layers (e.g., the OAP cluster's own metrics layer).

### Operate (static)

These items are always present (RBAC permitting):

- Cluster Status (`cluster:read`)
- Inspect (`inspect:read`)
- DSL Management (`rule:read`)
- Live Debugger (`live-debug:read`)
- Alarm Setup (`alarm-setup:read`)
- Alarm Rules (`alarm-rule:read`)

These are not layer-derived; they are first-class Horizon features.

### Admin (RBAC permitting)

- Auth Status, Users, Roles & Permissions (each verb-gated; see [Admin Pages](../access-control/admin-pages.md)).
- Overview Templates editor (`overview:write`).
- Layer Templates editor (`dashboard:write`).

## Per-layer composition

When a user clicks a layer in the sidebar, `firstLayerTab()` picks the first enabled sub-route from this priority order:

```
service → instance → endpoint → topology → trace → logs → profiling
```

The enablement comes from the template's `components` flags (mapped onto `caps` in the menu response):

```json
{
  "key": "GENERAL",
  "components": {
    "service": true,
    "instance": true,
    "endpoint": true,
    "topology": true,
    "trace": true,
    "logs": false,
    "profiling": true
  }
}
```

A layer with `components.service: false` and only `topology: true` will land directly on the Topology tab when clicked.

## Customization surface

| Want to | Edit |
|---|---|
| Rename a layer in the sidebar | `alias` in `bundled_templates/layers/<key>.json` |
| Change a layer's color | `color` |
| Group several layers under one collapsible header | `group` (same string on multiple layers) |
| Move a layer into the Operate section | `visibility: operate` |
| Hide a tab on a layer | flip the corresponding `components.*` flag |
| Change which sub-route is the landing tab | reorder via `components` flags (the leftmost enabled wins, per priority above) |
| Add an external doc link | `documentLink` |
| Re-order layers in the sidebar | per-user via the landing-order control (setup store) |
| Add a brand-new layer | OAP-side first (must show up in `listLayers`), then add a template — see [Adding a New Layer](adding-a-new-layer.md) |

The menu is **never user-editable as a tree** in the UI. Customization is always via:

- Templates (for cosmetics + feature toggles), or
- The setup store (for per-user ordering), or
- OAP itself (for layer existence).

## What "active" means

A layer is `active: true` when OAP returns it from `listLayers`. An inactive layer can still appear in the menu response (so the admin can enable it via the setup page) but is **not shown in the sidebar**. Once OAP starts reporting it (e.g., once data arrives for that layer), the sidebar shows it on the next `/api/menu` refresh.

This means: **stand up your OAP receivers first, install/configure them to ingest data for the layer you want, then refresh Horizon**. The sidebar is purely reactive to OAP state.

## When OAP is unreachable

`/api/menu` returns `oap.reachable: false` and `serviceCount: -1` for every layer. The sidebar still renders the last-known shape (the BFF caches the most recent successful response in memory) with an "OAP unreachable" banner. This avoids the UX collapse of a fully empty sidebar during a brief OAP blip.

## Polling cadence

- The UI fetches `/api/menu` on mount and on tab focus (return-to-tab triggers a refresh).
- The BFF does not cache `/api/menu` responses cross-request — every call re-queries OAP. For very large layer counts this can be tuned; file an issue if you see latency.

## Related

- [Layer Dashboard Templates](layer-templates.md) — the JSON shape that backs each layer.
- [Overview Templates](overview-templates.md) — the war-room overviews (separate from the sidebar).
- [Adding a New Layer](adding-a-new-layer.md) — end-to-end recipe.

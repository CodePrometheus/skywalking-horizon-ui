# OAP Version Requirement

## Minimum: OAP 10.0; recommended OAP 10.5.0+

Horizon UI runs against **any Apache SkyWalking OAP in the 10.x line**. Most of the UI works against 10.0–10.4; one page — **Inspect** — additionally requires **10.5.0+** because it calls the [Inspect API (SWIP-14)](https://github.com/apache/skywalking/blob/master/docs/en/swip/swip-14.md) endpoints that were introduced in 10.5.

Older 9.x OAPs are not supported — the layer concept, the MQE language baseline Horizon assumes, and the admin port layout all settled in 10.0.

### Feature matrix vs OAP version

| Horizon feature | OAP 10.0–10.4 | OAP 10.5.0+ |
|---|---|---|
| Layer dashboards, overviews | ✓ | ✓ |
| Alarms (read) | ✓ — falls back to legacy `getAlarm` when `queryAlarms` is absent | ✓ — uses `queryAlarms` (server-side layer filter) when present |
| Traces (native + Zipkin), Logs, Topology | ✓ | ✓ |
| Profiling (trace / async / pprof / eBPF) | ✓ — per the profiling modules you've turned on | ✓ |
| Cluster Status — Query pane | ✓ | ✓ |
| Cluster Status — Admin pane (admin-server, runtime-rule, dsl-debugging) | ✓ — module probe works on any v10 admin-server | ✓ — also reports the `inspect` module |
| DSL Management, Live Debugger, Alarm Rule editor | ✓ — needs `receiver-runtime-rule` + `dsl-debugging` modules on (any v10) | ✓ |
| MQE execution / metric reads | ✓ — Horizon's MQE target resolver discovers the REST port from `core.restHost`/`core.restPort` when `sharing-server` is absent | ✓ — uses `sharing-server.default.restPort` (the v10.5+ default) |
| **Inspect page** (metric catalog + entity enumerator) | ✗ — endpoints don't exist; the page is hidden / returns 404 | ✓ — requires `SW_INSPECT=default` on OAP |

### What "requires 10.5.0+" means in practice for the Inspect page

- The Inspect page makes calls to `GET /inspect/metrics` and `GET /inspect/entities` on the OAP admin port. These endpoints only exist in OAP 10.5.0+.
- Horizon's Cluster Status → Admin pane probes the `inspect` module via the OAP config dump. On an OAP < 10.5, the module is not in the dump, so the pane shows `inspect` as off and the Inspect tab is hidden from the sidebar. There is no broken-half-rendered state.
- All other pages remain fully functional on 10.0–10.4. The compatibility cliff is scoped to one page.

If you run 10.0–10.4 and don't need the Inspect tab, you don't need to upgrade. If you do need it, upgrade OAP to 10.5.0+ and set `SW_INSPECT=default`.

## Where the version is shown

Once Horizon is up:

- **Topbar status chip** — small build-version pill in the right-side cluster strip, fed by the GraphQL `version` query.
- **Cluster Status page → Query pane** (`/admin/cluster`) — version, server timezone, current timestamp, health score.

The version is fetched via:

```graphql
query { version }
```

against the OAP query port (default `:12800`), polled every 30 seconds.

## What "compatible" means in practice

Horizon does **not** lock to a specific OAP minor version. The BFF probes OAP's GraphQL schema via introspection and degrades gracefully when newer features are missing:

- **Alarms**: prefers the modern `queryAlarms` capability (server-side layer filter) and falls back to the legacy `getAlarm` (all-layers + client-side filter) when the schema doesn't include it.
- **Per-call capability cache** ensures the probe runs once per BFF lifetime, not per request.

This means a Horizon release built against OAP 10.5.0 will continue to work against OAP 10.7, 10.8, etc., picking up new server-side capabilities automatically when they appear — and will also keep working against an older 10.x OAP at the cost of the Inspect page.

## Versions of related pieces

| Piece | Where to check |
|---|---|
| OAP version | Topbar chip, Cluster Status page |
| Horizon UI version | Package `apps/ui/package.json` |
| Horizon BFF version | Package `apps/bff/package.json` |
| GraphQL query-protocol | `oap-server/server-query-plugin/.../query-protocol/*.graphqls` in apache/skywalking |
| MQE language | OAP repo (`oap-server/mqe-rt`) |

## Upgrading OAP under a running Horizon

OAP upgrades are zero-coordination from Horizon's side:

1. Roll OAP. The query port and admin port get the new build.
2. Horizon's 30-second poll picks up the new `version` string. The capability cache is keyed per BFF process lifetime — a BFF restart re-probes; a hot OAP upgrade keeps the cached capability set until the BFF restarts.

If you change the OAP capability surface during the upgrade (e.g., enable `SW_INSPECT=default` for the first time), restart the BFF to re-probe.

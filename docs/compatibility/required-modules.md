# Required OAP Modules

Horizon UI talks to OAP through **two ports**:

- `:12800` — GraphQL query port (always required).
- `:17128` — admin REST port (required for Cluster Status, Inspect, DSL Management, Live Debugger).

The admin-port endpoints are gated by per-module selectors on the OAP side. Horizon detects which modules are on by parsing `GET /debugging/config/dump` and using a prefix match against the flat key map it returns.

## Module table

| Module | OAP env-var | Min OAP | Endpoints Horizon hits | What breaks if disabled |
|---|---|---|---|---|
| **admin-server** | `SW_ADMIN_SERVER=default` | 10.0 | `GET /debugging/config/dump` | Everything on the admin port. With admin-server off, all three other selectors report `enabled: false` regardless of their actual state. |
| **receiver-runtime-rule** | `SW_RECEIVER_RUNTIME_RULE=default` | 10.0 | `GET /runtime/rule/list`, `GET /runtime/rule`, `POST /runtime/rule/addOrUpdate`, `POST /runtime/rule/delete`, `GET /runtime/rule/bundled` | DSL Management page; alarm rule editor save/load; cluster-status rule matrix; Live Debugger rule picker; Inspect page source attribution. |
| **dsl-debugging** | `SW_DSL_DEBUGGING=default` | 10.0 | `GET /dsl-debugging/status`, `GET /status/alarm/*` | Live Debugger (MAL / LAL / OAL session start, poll, stop); cluster-status DSL health pane; alarm rule diagnostics. |
| **inspect** | `SW_INSPECT=default` | **10.5.0** | `GET /inspect/metrics`, `GET /inspect/entities` | Inspect page (returns 404 from OAP). |

All four are recommended. **admin-server** is non-optional; the rest can be left off if you do not need the corresponding feature, but the Cluster Status page will surface warnings.

The `inspect` module is the only one that requires OAP 10.5.0+; the first three exist in every 10.x release. On an OAP < 10.5, the `inspect` row in the Cluster Status → Admin pane reports off (the module isn't in the config dump) and the Inspect tab is hidden from the sidebar — the rest of the UI is unaffected. See [OAP Version](oap-version.md) for the full feature-vs-version matrix.

## How Horizon detects module state

Source: `apps/bff/src/logic/preflight/preflight.ts`.

1. BFF fires `GET <adminUrl>/debugging/config/dump` (polled every 60 seconds from the UI).
2. OAP returns a flat key/value map in `module.provider.property` form, e.g.:

   ```
   admin-server.default.host=0.0.0.0
   admin-server.default.port=17128
   receiver-runtime-rule.default.notifyConfigChange=true
   inspect.default.cacheTimeoutInMinutes=10
   ```

3. For each required module, Horizon checks whether **any** key with that module's prefix appears in the dump. A single match means the module is loaded.
4. The result is exposed via `GET /api/preflight` to the UI, which renders:

   - **Green badge** — module is on.
   - **Yellow badge** — module is off; corresponding pages are disabled with a hint mentioning the env-var.
   - **Red banner** — admin-server itself is off / unreachable; every dependent module reports off.

## Recommended OAP environment for Horizon

The minimum set:

```sh
SW_CORE_GRPC_SSL_ENABLED=false           # if applicable to your deployment
SW_ADMIN_SERVER=default
SW_RECEIVER_RUNTIME_RULE=default
SW_DSL_DEBUGGING=default
SW_INSPECT=default
```

Without these four selectors active, Horizon falls back to a "query-only" mode: dashboards and triage screens work, but the entire **Operate** section of the sidebar (Cluster, Inspect, DSL Management, Live Debugger) is degraded.

## What if the admin port is unreachable but selectors are on?

A common state in Kubernetes deployments: the OAP container has `SW_INSPECT=default` but the Service does not expose port 17128. Horizon cannot distinguish "module off" from "port not exposed" — both produce a failed `GET /debugging/config/dump`.

The Cluster Status → Admin pane shows this case as **"admin host unreachable"** with a hint:

> Confirm the `admin-server` module is on (`SW_ADMIN_SERVER=default`) **and** the admin port (default 17128) is exposed by your Kubernetes Service / firewall / load balancer.

See [Cluster Status Check Sequence](cluster-status.md) for the detailed per-pane behavior.

# setup and alarms

State files for user-configured settings. Both write JSON, both are managed by the BFF, neither needs hand-editing.

```yaml
setup:
  file: ./horizon-setup.json

alarms:
  file: ./horizon-alarms.json
```

## `setup.file`

| Field | Type | Default | Required | Notes |
|---|---|---|---|---|
| `setup.file` | string | `./horizon-setup.json` | no | Filesystem path to the setup state. Relative paths resolve from the BFF working directory. |

Holds:

- Per-user landing layer order (`landing.priority`).
- Layer-level setup state (which layers the user has marked as enabled / disabled in their sidebar).
- Other persistent UI preferences that survive sessions.

The UI writes this file as users change their landing order and layer enablement; the file is updated atomically (write-temp-then-rename).

## `alarms.file`

| Field | Type | Default | Required | Notes |
|---|---|---|---|---|
| `alarms.file` | string | `./horizon-alarms.json` | no | Filesystem path to the alarm rules state. |

Holds user-created alarm rules (in addition to whatever the OAP cluster ships bundled). The Alarm Rule Editor (Operate → Alarm Rules) writes here.

## Env-var fallbacks

When `horizon.yaml` does not supply a `setup.file` or `alarms.file` (or `audit.file` / `debugLog.file`), the default is seeded from an env var:

| YAML key | Env-var fallback | Default |
|---|---|---|
| `setup.file` | `HORIZON_SETUP_FILE` | `./horizon-setup.json` |
| `alarms.file` | `HORIZON_ALARMS_FILE` | `./horizon-alarms.json` |
| `audit.file` | `HORIZON_AUDIT_FILE` | `./horizon-audit.jsonl` |
| `debugLog.file` | `HORIZON_WIRE_LOG_FILE` | `./horizon-wire.jsonl` |

The published Docker image sets all four env vars to `/data/...` paths so an operator who runs the image without a `horizon.yaml` override gets writes routed to the declared `/data` volume — see [Container Image → Persisting state files](container-image.md#persisting-state-files-audit-setup-alarms-debuglog). An explicit value in `horizon.yaml` always wins over the env-var fallback.

## Operational notes

- **Both are mutable runtime state.** They should be on durable storage, not a container tmpfs.
- **Both are gitignored by default** (see `.gitignore`). They are not source-controlled; they are operational state.
- **Atomic writes.** Both stores write-temp-then-rename, so a crash mid-write cannot truncate the file.
- **No schema migration tooling yet.** If a future release changes the on-disk shape, you may need to delete the file and re-configure. (Documented per release.)

## Hot reload

The files are watched at startup. Changes made by the BFF itself take effect immediately. Editing the files by hand mid-run is not supported — restart the BFF after manual edits.

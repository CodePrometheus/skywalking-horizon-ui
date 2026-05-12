<!--
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->
<!--
  Services tab body. The page-wide selector zone (in LayerShell) already
  carries the services table + pinned selected service, so this view
  doesn't duplicate that — it surfaces layer-wide insight (apdex
  distribution + counts) and drill links into the deeper per-service
  tabs (Dashboards / Instances / Traces / Logs).
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import type { LayerDef } from '@skywalking-horizon-ui/api-client';
import { useLayerLanding } from '@/composables/useLayerLanding';
import { useLayers } from '@/composables/useLayers';
import { useSelectedService } from '@/composables/useSelectedService';
import { useSetupStore } from '@/stores/setup';

const route = useRoute();
const layerKey = computed(() => String(route.params.layerKey ?? ''));
const { layers } = useLayers();
const layer = computed<LayerDef | null>(() => layers.value.find((l) => l.key === layerKey.value) ?? null);
const store = useSetupStore();
const cfg = computed(() => {
  if (!layer.value) return null;
  return store.ensure(layer.value.key, { slots: layer.value.slots, caps: layer.value.caps });
});

const safeLayer = computed<LayerDef>(() => layer.value ?? {
  key: layerKey.value,
  name: layerKey.value,
  color: 'var(--sw-fg-2)',
  serviceCount: -1,
  active: false,
  level: null,
  slots: {},
  caps: {},
});
const safeCfg = computed(() => cfg.value?.landing ?? {
  priority: 99,
  topN: 5,
  orderBy: 'cpm',
  columns: [],
  style: 'table' as const,
});
const landing = useLayerLanding(safeLayer, safeCfg);
const sampled = computed(() => landing.data.value?.sampledRows ?? landing.rows.value ?? []);
const { selectedId } = useSelectedService();

// Apdex distribution — driven by the per-service apdex column when the
// operator has it configured. Skips rendering when the column is
// missing so we don't show a hard-coded zero histogram.
const apdexBuckets = computed(() => {
  const buckets = [
    { label: '0.95 – 1.00', min: 0.95, color: 'var(--sw-ok)', count: 0 },
    { label: '0.85 – 0.95', min: 0.85, color: 'var(--sw-info)', count: 0 },
    { label: '0.70 – 0.85', min: 0.70, color: 'var(--sw-warn)', count: 0 },
    { label: '< 0.70', min: -Infinity, color: 'var(--sw-err)', count: 0 },
  ];
  for (const row of sampled.value) {
    const v = row.metrics['apdex'];
    if (v === null || v === undefined || !Number.isFinite(v)) continue;
    for (const b of buckets) {
      if (v >= b.min) {
        b.count++;
        break;
      }
    }
  }
  return buckets;
});
const hasApdex = computed(() =>
  (cfg.value?.landing.columns ?? []).some((c) => c.metric === 'apdex'),
);
const totalApdex = computed(() => apdexBuckets.value.reduce((a, b) => a + b.count, 0));

interface Drill {
  to: string;
  label: string;
  desc: string;
  enabled: boolean;
}
const drills = computed<Drill[]>(() => {
  const L = layer.value;
  if (!L) return [];
  const k = layerKey.value;
  const q = selectedId.value ? `?service=${encodeURIComponent(selectedId.value)}` : '';
  const out: Drill[] = [];
  if (L.caps.dashboards) {
    out.push({
      to: `/layer/${k}/dashboards${q}`,
      label: 'Dashboards',
      desc: 'Live widget grid driven by booster-ui templates.',
      enabled: true,
    });
  }
  if (L.slots.instances) {
    out.push({
      to: `/layer/${k}/instances${q}`,
      label: cfg.value?.slots.instances || L.slots.instances || 'Instances',
      desc: 'Per-instance metrics, agent status, JVM/process drill.',
      enabled: false,
    });
  }
  if (L.slots.endpoints) {
    out.push({
      to: `/layer/${k}/endpoints${q}`,
      label: cfg.value?.slots.endpoints || L.slots.endpoints || 'Endpoints',
      desc: 'API endpoints exposed by this service.',
      enabled: false,
    });
  }
  if (L.caps.traces) {
    out.push({
      to: `/layer/${k}/traces${q}`,
      label: 'Traces',
      desc: 'Trace explorer scoped to this service.',
      enabled: false,
    });
  }
  if (L.caps.logs) {
    out.push({
      to: `/layer/${k}/logs${q}`,
      label: 'Logs',
      desc: 'Log explorer scoped to this service.',
      enabled: false,
    });
  }
  if (L.caps.profiling) {
    out.push({
      to: `/layer/${k}/profiling${q}`,
      label: 'Profiling',
      desc: 'Flame graphs + sampled stacks.',
      enabled: false,
    });
  }
  return out;
});
const reachable = computed(() => landing.data.value?.reachable !== false);
</script>

<template>
  <div class="services-tab">
    <div v-if="!reachable" class="banner err">
      <strong>OAP unreachable.</strong>
      Live service data is unavailable for this layer. Showing what's cached.
    </div>

    <div class="grid">
      <section class="sw-card drill-card">
        <div class="card-head">
          <h4>Drill into the selected service</h4>
          <span class="sub">other tabs auto-scope via <code>?service=</code></span>
        </div>
        <div class="drill-grid">
          <RouterLink
            v-for="d in drills"
            :key="d.label"
            :to="d.to"
            class="drill"
            :class="{ disabled: !d.enabled }"
          >
            <div class="drill-head">
              <span class="drill-label">{{ d.label }}</span>
              <span v-if="!d.enabled" class="sw-badge">soon</span>
            </div>
            <p class="drill-desc">{{ d.desc }}</p>
          </RouterLink>
          <p v-if="drills.length === 0" class="empty">
            No deep-dive views configured for this layer.
          </p>
        </div>
      </section>

      <section v-if="hasApdex && totalApdex > 0" class="sw-card apdex-card">
        <div class="card-head">
          <h4>Apdex distribution</h4>
          <span class="sub">{{ totalApdex }} services bucketed</span>
        </div>
        <div class="apdex-body">
          <div v-for="b in apdexBuckets" :key="b.label" class="apdex-row">
            <span class="sw-tag">{{ b.label }}</span>
            <div class="bar">
              <div
                class="bar-fill"
                :style="{ width: `${(b.count / totalApdex) * 100}%`, background: b.color }"
              />
            </div>
            <span class="count">{{ b.count }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.services-tab {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.banner.err {
  padding: 8px 12px;
  background: var(--sw-err-soft);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #f87171;
  font-size: 11.5px;
}
.grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 14px;
  align-items: start;
}
.card-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--sw-line);
}
.card-head h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--sw-fg-0);
}
.card-head .sub {
  font-size: 10.5px;
  color: var(--sw-fg-3);
}
.card-head .sub code {
  font-family: var(--sw-mono);
  font-size: 10px;
  background: var(--sw-bg-2);
  padding: 0 3px;
  border-radius: 2px;
}
.drill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  padding: 12px 14px;
}
.drill {
  background: var(--sw-bg-1);
  border: 1px solid var(--sw-line-2);
  border-radius: 6px;
  padding: 10px 12px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.12s, background 0.12s;
}
.drill:hover {
  background: var(--sw-bg-2);
  border-color: var(--sw-line-3);
}
.drill.disabled {
  border-style: dashed;
  opacity: 0.7;
  pointer-events: none;
}
.drill-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}
.drill-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--sw-fg-0);
}
.drill-desc {
  margin: 4px 0 0;
  font-size: 10.5px;
  color: var(--sw-fg-3);
  line-height: 1.5;
}
.empty {
  margin: 0;
  font-size: 11.5px;
  color: var(--sw-fg-3);
}
.apdex-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.apdex-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.apdex-row .sw-tag {
  width: 96px;
  font-size: 10px;
  text-align: center;
}
.apdex-row .bar {
  flex: 1;
  height: 6px;
  background: var(--sw-bg-3);
  border-radius: 3px;
  overflow: hidden;
}
.apdex-row .bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.2s ease-out;
}
.apdex-row .count {
  width: 30px;
  text-align: right;
  font-family: var(--sw-mono);
  font-size: 10.5px;
  color: var(--sw-fg-0);
  font-variant-numeric: tabular-nums;
}
@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

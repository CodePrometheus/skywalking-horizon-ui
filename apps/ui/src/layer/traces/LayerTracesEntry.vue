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
  Per-layer Traces tab dispatcher. Routes route `/layer/:key/trace` to
  either `LayerTracesView.vue` (SkyWalking-native) or
  `LayerZipkinTracesView.vue` based on the layer template's
  `traces.source` flag. For `source: 'both'` we render a small
  source-toggle bar above the active view so the operator can flip
  between the two trace stores.

  The router can't make this decision statically (it has no menu data
  at route-resolve time), so this dispatcher reads `useLayers()`
  client-side and swaps the inner component.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { LayerDef } from '@skywalking-horizon-ui/api-client';
import { useLayers } from '@/shell/useLayers';
import LayerTracesView from './LayerTracesView.vue';
import LayerZipkinTracesView from './LayerZipkinTracesView.vue';

const route = useRoute();
const layerKey = computed(() => String(route.params.layerKey ?? ''));
const { layers } = useLayers();
const layer = computed<LayerDef | null>(() => layers.value.find((l) => l.key === layerKey.value) ?? null);

/** `source: 'native' | 'zipkin' | 'both'` — defaults to native when
 *  the layer template doesn't carry a `traces` block. */
const configuredSource = computed<'native' | 'zipkin' | 'both'>(
  () => layer.value?.traces?.source ?? 'native',
);
/** Active source. When `configured = both`, the operator toggle wins;
 *  otherwise the configured value is locked. */
const activeSource = ref<'native' | 'zipkin'>('native');
watch(
  configuredSource,
  (s) => {
    if (s === 'zipkin') activeSource.value = 'zipkin';
    else if (s === 'native') activeSource.value = 'native';
    else if (activeSource.value !== 'zipkin') activeSource.value = 'native';
  },
  { immediate: true },
);
const showToggle = computed(() => configuredSource.value === 'both');
</script>

<template>
  <div class="trc-entry">
    <div v-if="showToggle" class="trc-source-toggle">
      <span class="kicker">Source</span>
      <button
        type="button"
        class="trc-source-btn"
        :class="{ on: activeSource === 'native' }"
        @click="activeSource = 'native'"
      >Native</button>
      <button
        type="button"
        class="trc-source-btn"
        :class="{ on: activeSource === 'zipkin' }"
        @click="activeSource = 'zipkin'"
      >Zipkin</button>
    </div>
    <LayerZipkinTracesView v-if="activeSource === 'zipkin'" />
    <LayerTracesView v-else />
  </div>
</template>

<style scoped>
.trc-entry { display: flex; flex-direction: column; gap: 8px; }
.trc-source-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  align-self: flex-start;
  background: var(--sw-bg-1);
  border: 1px solid var(--sw-line);
  border-radius: 6px;
}
.kicker {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sw-fg-3);
  font-weight: 600;
  margin-right: 2px;
}
.trc-source-btn {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--sw-fg-2);
  background: transparent;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
.trc-source-btn:hover { background: var(--sw-bg-2); color: var(--sw-fg-0); }
.trc-source-btn.on { background: var(--sw-bg-3); color: var(--sw-fg-0); font-weight: 600; }
</style>

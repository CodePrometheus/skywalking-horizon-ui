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
  d3-flame-graph wrapper for trace profiling analyze results. Mirrors
  the booster-ui Content.vue drawing logic but extracted as a focused
  component the trace + eBPF + async + pprof views can all reuse.

  Inputs:
    trees: ProfileAnalyzationTree[]  — server-returned analyze trees
    metricKey: 'count' | 'duration'  — what value drives the box width
                                       (count for trace, duration for
                                       eBPF / async / pprof). Default
                                       is `count`.
-->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as d3 from 'd3';
import { flamegraph } from 'd3-flame-graph';
import type { ProfileAnalyzationElement, ProfileAnalyzationTree } from '@/api/client';

interface FlameNode {
  name: string;
  value: number;
  count: number;
  duration: number;
  durationChildExcluded: number;
  codeSignature: string;
  parentId: string;
  originId: string;
  children?: FlameNode[];
}

const props = withDefaults(
  defineProps<{
    trees: ProfileAnalyzationTree[];
    metricKey?: 'count' | 'duration';
  }>(),
  { metricKey: 'count' },
);

const root = ref<HTMLDivElement | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chart: any = null;

function metricFor(el: ProfileAnalyzationElement): number {
  if (props.metricKey === 'duration') return Math.max(0, el.duration);
  return Math.max(0, el.count);
}

function buildVirtualRoot(): FlameNode | null {
  if (!props.trees.length) return null;
  const all: number[] = [];
  for (const t of props.trees) for (const el of t.elements) all.push(metricFor(el));
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 1;
  const scale = d3.scaleLinear().domain([min, max]).range([1, 200]);

  function processTree(arr: ProfileAnalyzationElement[]): FlameNode | null {
    const items = arr.map<FlameNode>((el) => ({
      name: el.codeSignature,
      value: Number(scale(metricFor(el)).toFixed(4)),
      count: el.count,
      duration: el.duration,
      durationChildExcluded: el.durationChildExcluded,
      codeSignature: el.codeSignature,
      parentId: String(Number(el.parentId) + 1),
      originId: String(Number(el.id) + 1),
    }));
    const idx: Record<string, FlameNode> = {};
    for (const it of items) idx[it.originId] = it;
    let r: FlameNode | null = null;
    for (const it of items) {
      if (it.parentId === '1') r = it;
      const me = idx[it.originId];
      const parent = idx[me.parentId];
      if (parent) (parent.children ??= []).push(me);
    }
    return r;
  }

  const virtRoot: FlameNode = {
    name: 'Virtual Root',
    value: 0,
    count: 0,
    duration: 0,
    durationChildExcluded: 0,
    codeSignature: 'Virtual Root',
    parentId: '0',
    originId: '1',
    children: [],
  };
  for (const tree of props.trees) {
    const r = processTree(tree.elements);
    if (r) virtRoot.children?.push(r);
  }
  // Roll up so a parent never reports less than the sum of its children
  // — d3-flame-graph requires that to lay frames out correctly.
  function rollup(n: FlameNode): void {
    if (n.children?.length) {
      let s = 0;
      for (const c of n.children) {
        rollup(c);
        s += c.value;
      }
      if (n.value < s) n.value = s;
    }
  }
  for (const c of virtRoot.children ?? []) rollup(c);
  let total = 0;
  for (const c of virtRoot.children ?? []) total += c.value;
  virtRoot.value = total;
  return virtRoot;
}

function draw(): void {
  if (!root.value) return;
  if (chart) {
    try {
      chart.destroy();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      /* no-op */
    }
    chart = null;
  }
  root.value.innerHTML = '';
  const tree = buildVirtualRoot();
  if (!tree) return;
  const width = Math.max(root.value.getBoundingClientRect().width, 600);
  chart = flamegraph()
    .width(width - 12)
    .cellHeight(18)
    .transitionDuration(450)
    .minFrameSize(1)
    .transitionEase(d3.easeCubic as never)
    .sort(true)
    .title('')
    .selfValue(false)
    .inverted(true)
    .setColorMapper((d: { highlight: boolean }, original: string) =>
      d.highlight ? '#6aff8f' : original,
    );

  // Plain in-DOM tooltip (the booster-ui implementation pulled in
  // d3-tip; we use a single appended <div> instead to avoid the dep).
  const tip = document.createElement('div');
  tip.className = 'fg-tip';
  document.body.appendChild(tip);
  chart.tooltip(false);
  d3.select(root.value).datum(tree).call(chart);
  const svg = root.value.querySelector('svg');
  if (svg) {
    svg.addEventListener('mousemove', (event) => {
      const target = (event.target as Element).closest('g');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = target && (d3.select(target as Element).datum() as any);
      if (!data || !data.data) {
        tip.style.display = 'none';
        return;
      }
      const d = data.data as FlameNode;
      const pctRoot = tree.count
        ? ((d.count / tree.count) * 100).toFixed(2)
        : '0';
      tip.innerHTML = `
        <div class="t-row"><strong>${escapeHtml(d.codeSignature)}</strong></div>
        <div class="t-row">Dump Count: ${d.count}</div>
        <div class="t-row">Duration: ${d.duration} ns</div>
        <div class="t-row">Duration (excl. children): ${d.durationChildExcluded} ns</div>
        <div class="t-row">% of root: ${pctRoot}%</div>
      `;
      tip.style.display = 'block';
      const me = event as MouseEvent;
      tip.style.left = me.clientX + 16 + 'px';
      tip.style.top = me.clientY + 16 + 'px';
    });
    svg.addEventListener('mouseleave', () => {
      tip.style.display = 'none';
    });
    // Make absolutely sure the tip leaves with us on unmount.
    onBeforeUnmount(() => tip.remove());
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}

onMounted(draw);
watch(() => [props.trees, props.metricKey], draw);
onBeforeUnmount(() => {
  if (chart) {
    try {
      chart.destroy();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      /* no-op */
    }
    chart = null;
  }
});
</script>

<template>
  <div ref="root" class="fg-host"></div>
</template>

<style scoped>
.fg-host {
  width: 100%;
  height: 100%;
  overflow: auto;
  cursor: pointer;
}
.fg-host :deep(svg) {
  width: 100%;
}
</style>

<style>
.fg-tip {
  position: fixed;
  display: none;
  pointer-events: none;
  z-index: 9999;
  background: var(--sw-bg-1, #1b1d24);
  color: var(--sw-fg-0, #f5f7fb);
  border: 1px solid var(--sw-line, #2a2d36);
  border-radius: 4px;
  padding: 8px 10px;
  font-family: var(--sw-mono, monospace);
  font-size: 11px;
  max-width: 420px;
  line-height: 1.45;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}
.fg-tip .t-row + .t-row {
  margin-top: 3px;
}
.fg-tip strong {
  color: var(--sw-fg-0, #f5f7fb);
  font-weight: 600;
}
</style>

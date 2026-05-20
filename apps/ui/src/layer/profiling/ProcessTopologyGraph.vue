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
  Process-level topology for network profiling. Renders the
  `getProcessTopology` payload as a d3-force-directed graph with:
    - real processes drawn as filled circles
    - virtual peers (`isReal: false`) drawn as hollow triangles
    - directional curved edges with detect-point pills
    - drag to reposition, click to select

  Emits:
    select-node — full ProcessNode object
    select-call — full ProcessCall object (with attached source/target)
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as d3 from 'd3';
import type { ProcessCall, ProcessNode } from '@/api/client';

interface SimNode extends ProcessNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}
interface SimLink {
  id: string;
  source: SimNode;
  target: SimNode;
  detectPoints: string[];
  arcOffset: number;
}

const props = defineProps<{ nodes: ProcessNode[]; calls: ProcessCall[] }>();
const emit = defineEmits<{
  (e: 'select-node', n: ProcessNode | null): void;
  (e: 'select-call', c: ProcessCall | null): void;
}>();

const host = ref<HTMLDivElement | null>(null);
const selectedNodeId = ref<string | null>(null);
const selectedCallId = ref<string | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let simulation: any = null;

function buildLinks(): SimLink[] {
  const seen = new Map<string, number>();
  const links: SimLink[] = [];
  const idx = new Map<string, SimNode>();
  for (const n of props.nodes) idx.set(n.id, n as SimNode);
  for (const c of props.calls) {
    const src = idx.get(c.source);
    const tgt = idx.get(c.target);
    if (!src || !tgt) continue;
    const pairKey = [c.source, c.target].sort().join('|');
    const offset = seen.get(pairKey) ?? 0;
    seen.set(pairKey, offset + 1);
    links.push({
      id: c.id,
      source: src,
      target: tgt,
      detectPoints: c.detectPoints ?? [],
      arcOffset: offset,
    });
  }
  return links;
}

function render(): void {
  if (!host.value) return;
  host.value.innerHTML = '';
  const w = host.value.getBoundingClientRect().width || 640;
  const h = host.value.getBoundingClientRect().height || 480;

  const svg = d3
    .select(host.value)
    .append('svg')
    .attr('width', w)
    .attr('height', h);

  // Pan/zoom group
  const g = svg.append('g').attr('class', 'g-root');
  svg.call(
    d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (ev) => g.attr('transform', ev.transform.toString())) as never,
  );
  // Arrow marker
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'arrow-pn')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 16)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5 L10,0 L0,5')
    .attr('fill', 'var(--sw-fg-3, #6c7080)');

  const nodes = props.nodes.map((n) => ({ ...(n as SimNode) }));
  const links = buildLinks();
  // Re-target SimLinks against the mutable nodes (forceLink mutates them).
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const l of links) {
    l.source = byId.get(l.source.id)!;
    l.target = byId.get(l.target.id)!;
  }

  simulation = d3
    .forceSimulation<SimNode>(nodes)
    .force(
      'link',
      d3
        .forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(120)
        .strength(0.6),
    )
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(w / 2, h / 2))
    .force('collide', d3.forceCollide<SimNode>().radius(28));

  // Edges
  const linkG = g.append('g').attr('class', 'links');
  const edge = linkG
    .selectAll('path.edge')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'edge')
    .attr('fill', 'none')
    .attr('stroke', 'var(--sw-line-2, #3a3d47)')
    .attr('stroke-width', 1.4)
    .attr('marker-end', 'url(#arrow-pn)')
    .style('cursor', 'pointer')
    .on('click', (_ev, d) => {
      selectedCallId.value = d.id;
      selectedNodeId.value = null;
      restyleEdges();
      emit(
        'select-call',
        props.calls.find((c) => c.id === d.id) ?? null,
      );
    });

  // Highlight the selected edge (accent + thicker) so the operator sees
  // which conversation the detail panel is bound to.
  function restyleEdges(): void {
    edge
      .attr('stroke', (d) =>
        d.id === selectedCallId.value ? 'var(--sw-accent, #f97316)' : 'var(--sw-line-2, #3a3d47)',
      )
      .attr('stroke-width', (d) => (d.id === selectedCallId.value ? 2.4 : 1.4));
  }
  // Detect-point pills
  const pills = linkG
    .selectAll('g.pill')
    .data(links.filter((l) => l.detectPoints.length))
    .enter()
    .append('g')
    .attr('class', 'pill');
  pills
    .append('rect')
    .attr('x', -22)
    .attr('y', -7)
    .attr('width', 44)
    .attr('height', 14)
    .attr('rx', 7)
    .attr('fill', 'var(--sw-bg-2, #1f2129)')
    .attr('stroke', 'var(--sw-line, #2a2d36)');
  pills
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.32em')
    .attr('fill', 'var(--sw-fg-2, #b4b7c2)')
    .style('font-family', 'var(--sw-mono, monospace)')
    .style('font-size', '9.5px')
    .text((d) => d.detectPoints.join(','));

  // Nodes
  const nodeG = g.append('g').attr('class', 'nodes');
  const node = nodeG
    .selectAll<SVGGElement, SimNode>('g.node')
    .data(nodes, (d) => d.id)
    .enter()
    .append('g')
    .attr('class', 'node')
    .style('cursor', 'grab')
    .on('click', (_ev, d) => {
      selectedNodeId.value = d.id;
      selectedCallId.value = null;
      restyleEdges();
      emit(
        'select-node',
        props.nodes.find((n) => n.id === d.id) ?? null,
      );
    })
    .call(
      d3
        .drag<SVGGElement, SimNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as never,
    );
  // Real process — circle. Virtual peer — triangle.
  node
    .filter((d) => d.isReal)
    .append('circle')
    .attr('r', 9)
    .attr('fill', 'var(--sw-accent, #f97316)')
    .attr('stroke', 'var(--sw-bg-1, #15171c)')
    .attr('stroke-width', 1.5);
  node
    .filter((d) => !d.isReal)
    .append('path')
    .attr('d', 'M-9,8 L9,8 L0,-8 Z')
    .attr('fill', 'var(--sw-bg-2, #1f2129)')
    .attr('stroke', 'var(--sw-line-2, #3a3d47)')
    .attr('stroke-width', 1.4);
  node
    .append('text')
    .attr('x', 14)
    .attr('dy', '0.32em')
    .attr('fill', 'var(--sw-fg-1, #d4d6dd)')
    .style('font-family', 'var(--sw-mono, monospace)')
    .style('font-size', '11px')
    .text((d) => d.name);

  simulation.on('tick', () => {
    edge.attr('d', (d) => {
      const sx = d.source.x ?? 0;
      const sy = d.source.y ?? 0;
      const tx = d.target.x ?? 0;
      const ty = d.target.y ?? 0;
      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // Curve more for each repeat of the (s,t) pair so directed
      // reverse edges don't overlap.
      const curve = d.arcOffset * 30 + (d.source.id > d.target.id ? 18 : 0);
      return `M ${sx} ${sy} A ${dist + curve} ${dist + curve} 0 0 1 ${tx} ${ty}`;
    });
    pills.attr('transform', (d) => {
      const mx = ((d.source.x ?? 0) + (d.target.x ?? 0)) / 2;
      const my = ((d.source.y ?? 0) + (d.target.y ?? 0)) / 2;
      return `translate(${mx},${my})`;
    });
    node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
  });
}

onMounted(render);
watch(() => [props.nodes, props.calls], render);
onBeforeUnmount(() => simulation?.stop());
</script>

<template>
  <div ref="host" class="topo-host"></div>
</template>

<style scoped>
.topo-host {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--sw-bg-0, #0d0f14);
}
</style>

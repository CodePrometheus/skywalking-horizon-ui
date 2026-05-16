/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect } from 'vitest';
import type { LayerDef } from '@skywalking-horizon-ui/api-client';
import { firstLayerTab } from './useLayers';

/**
 * Helper to build a partial-but-typed LayerDef. Real layers carry
 * dozens of fields the tab decision doesn't read; we only need the
 * caps + slots shape `firstLayerTab` consults.
 */
function L(caps: Partial<LayerDef['caps']> = {}, slots: Partial<LayerDef['slots']> = {}): LayerDef {
  return {
    key: 'TEST',
    name: 'Test',
    color: '#fff',
    serviceCount: 1,
    active: true,
    level: null,
    slots,
    caps,
  } as LayerDef;
}

describe('firstLayerTab — routing decision per layer caps', () => {
  it('returns `service` for an undefined layer (safe default)', () => {
    expect(firstLayerTab(undefined)).toBe('service');
  });

  it('returns `service` when caps.dashboards is true (canonical full layer)', () => {
    expect(firstLayerTab(L({ dashboards: true }))).toBe('service');
  });

  it('returns `service` when caps + many tabs all enabled — dashboards wins', () => {
    expect(
      firstLayerTab(L({ dashboards: true, instances: true, endpoints: true, traces: true })),
    ).toBe('service');
  });

  it('returns `instance` when dashboards false but instances cap is true (mesh_dp shape)', () => {
    expect(firstLayerTab(L({ instances: true }))).toBe('instance');
  });

  it('returns `instance` when only `slots.instances` label is set + caps.instances undefined', () => {
    expect(firstLayerTab(L({}, { instances: 'Sidecars' }))).toBe('instance');
  });

  it('explicit `caps.instances: false` beats a truthy slot — falls through past instance', () => {
    expect(firstLayerTab(L({ instances: false }, { instances: 'Sidecars', endpoints: 'EP' }))).toBe(
      'endpoint',
    );
  });

  it('returns `endpoint` when only endpoints cap', () => {
    expect(firstLayerTab(L({ endpoints: true }))).toBe('endpoint');
  });

  it('returns `topology` when any topology sub-cap is on (serviceMap / instanceTopology / processTopology)', () => {
    expect(firstLayerTab(L({ serviceMap: true }))).toBe('topology');
    expect(firstLayerTab(L({ instanceTopology: true }))).toBe('topology');
    expect(firstLayerTab(L({ processTopology: true }))).toBe('topology');
  });

  it('returns `dependency` when only endpointDependency', () => {
    expect(firstLayerTab(L({ endpointDependency: true }))).toBe('dependency');
  });

  it('returns `trace` when only traces', () => {
    expect(firstLayerTab(L({ traces: true }))).toBe('trace');
  });

  it('returns `logs` when only logs', () => {
    expect(firstLayerTab(L({ logs: true }))).toBe('logs');
  });

  it('returns the right profiling kind when only that profiling cap is on', () => {
    expect(firstLayerTab(L({ traceProfiling: true }))).toBe('trace-profiling');
    expect(firstLayerTab(L({ ebpfProfiling: true }))).toBe('ebpf-profiling');
    expect(firstLayerTab(L({ networkProfiling: true }))).toBe('network-profiling');
    expect(firstLayerTab(L({ asyncProfiling: true }))).toBe('async-profiling');
    expect(firstLayerTab(L({ pprofProfiling: true }))).toBe('pprof');
  });

  it('falls back to `service` when no caps at all (empty layer)', () => {
    expect(firstLayerTab(L({}))).toBe('service');
  });

  it('priority order matches the sidebar tab order — instance beats endpoint beats topology', () => {
    expect(firstLayerTab(L({ instances: true, endpoints: true, serviceMap: true }))).toBe(
      'instance',
    );
    expect(firstLayerTab(L({ endpoints: true, serviceMap: true }))).toBe('endpoint');
    expect(firstLayerTab(L({ serviceMap: true, traces: true }))).toBe('topology');
    expect(firstLayerTab(L({ traces: true, logs: true }))).toBe('trace');
    expect(firstLayerTab(L({ logs: true, traceProfiling: true }))).toBe('logs');
  });
});

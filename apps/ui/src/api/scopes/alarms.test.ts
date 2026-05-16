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

import { describe, it, expect, vi } from 'vitest';
import { AlarmsApi } from './alarms';
import type { BffClient } from '../client';

function makeStub() {
  const calls: Array<[string, string, unknown?]> = [];
  const bff = {
    request: vi.fn(async (method: string, path: string, body?: unknown) => {
      calls.push([method, path, body]);
      return {} as unknown;
    }),
  } as unknown as BffClient;
  return { bff, calls };
}

describe('AlarmsApi.list — query param assembly', () => {
  it('includes only the required fields when filters are empty', async () => {
    const { bff, calls } = makeStub();
    await new AlarmsApi(bff).list({ startTime: 100, endTime: 200 });
    expect(calls[0][1]).toBe('/api/alarms?startTime=100&endTime=200&pageNum=1&pageSize=100');
  });

  it('defaults pageNum=1 and pageSize=100 when not provided', async () => {
    const { bff, calls } = makeStub();
    await new AlarmsApi(bff).list({ startTime: 1, endTime: 2 });
    expect(calls[0][1]).toContain('pageNum=1');
    expect(calls[0][1]).toContain('pageSize=100');
  });

  it('forwards entity filters (service / instance / endpoint) with URL encoding', async () => {
    const { bff, calls } = makeStub();
    await new AlarmsApi(bff).list({
      startTime: 1,
      endTime: 2,
      service: 'mesh-svr::reviews',
      instance: 'reviews-pod-1',
      endpoint: '/api/orders',
    });
    expect(calls[0][1]).toBe(
      '/api/alarms?startTime=1&endTime=2&pageNum=1&pageSize=100&service=mesh-svr%3A%3Areviews&instance=reviews-pod-1&endpoint=%2Fapi%2Forders',
    );
  });

  it('forwards scope + keyword when present', async () => {
    const { bff, calls } = makeStub();
    await new AlarmsApi(bff).list({
      startTime: 1,
      endTime: 2,
      scope: 'Service',
      keyword: 'slow query',
    });
    expect(calls[0][1]).toContain('scope=Service');
    expect(calls[0][1]).toContain('keyword=slow+query');
  });
});

describe('AlarmsApi.traffic + services + config', () => {
  it('traffic GETs /api/alarms/traffic with start + end', async () => {
    const { bff, calls } = makeStub();
    await new AlarmsApi(bff).traffic(1000, 2000);
    expect(calls[0]).toEqual(['GET', '/api/alarms/traffic?startTime=1000&endTime=2000', undefined]);
  });

  it('services GETs with layer param', async () => {
    const { bff, calls } = makeStub();
    await new AlarmsApi(bff).services('MESH');
    expect(calls[0][1]).toBe('/api/alarms/services?layer=MESH');
  });

  it('config GET / saveConfig POST hit /api/alarms/config', async () => {
    const { bff, calls } = makeStub();
    const api = new AlarmsApi(bff);
    await api.config();
    await api.saveConfig({ trafficLayers: [{ layerKey: 'MESH', mqe: 'service_cpm' }] });
    expect(calls[0]).toEqual(['GET', '/api/alarms/config', undefined]);
    expect(calls[1][0]).toBe('POST');
    expect(calls[1][1]).toBe('/api/alarms/config');
    expect(calls[1][2]).toEqual({
      trafficLayers: [{ layerKey: 'MESH', mqe: 'service_cpm' }],
    });
  });
});

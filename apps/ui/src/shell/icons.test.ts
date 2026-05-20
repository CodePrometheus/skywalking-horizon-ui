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
import { sectionIcon, layerIcon } from './icons';

describe('sectionIcon — L0 header icon mapping', () => {
  it('returns fixed icons for the canonical sections', () => {
    expect(sectionIcon('Overviews')).toBe('dash');
    expect(sectionIcon('overview')).toBe('dash');
    expect(sectionIcon('Layers')).toBe('svc');
    expect(sectionIcon('Platform monitoring')).toBe('cluster');
    expect(sectionIcon('Operate')).toBe('set');
    expect(sectionIcon('Dashboard setup')).toBe('metric');
    expect(sectionIcon('Admin')).toBe('user');
  });

  it('case-insensitive — uppercase, mixed case all map the same', () => {
    expect(sectionIcon('LAYERS')).toBe('svc');
    expect(sectionIcon('lAyErs')).toBe('svc');
  });

  it('maps in-Layers sub-group buckets to their family glyph', () => {
    expect(sectionIcon('Istio')).toBe('mesh');
    expect(sectionIcon('Kubernetes')).toBe('cluster');
    expect(sectionIcon('Browser')).toBe('web');
    expect(sectionIcon('Databases')).toBe('db');
    expect(sectionIcon('Caches')).toBe('cache');
    expect(sectionIcon('Message queues')).toBe('topic');
    expect(sectionIcon('AWS')).toBe('cluster');
  });

  it('falls back to dash for unknown labels', () => {
    expect(sectionIcon('Custom Section')).toBe('dash');
    expect(sectionIcon('')).toBe('dash');
  });
});

describe('layerIcon — per-layer L1 icon mapping', () => {
  it('General service uses the Apache feather brand mark', () => {
    expect(layerIcon('general')).toBe('sky');
    expect(layerIcon('GENERAL')).toBe('sky');
    expect(layerIcon('general_service')).toBe('sky');
  });

  it('mesh family (mesh / mesh_cp / mesh_dp / istio* / envoy* / cilium*) → mesh', () => {
    expect(layerIcon('mesh')).toBe('mesh');
    expect(layerIcon('mesh_cp')).toBe('mesh');
    expect(layerIcon('mesh_dp')).toBe('mesh');
    expect(layerIcon('istio')).toBe('mesh');
    expect(layerIcon('envoy_ai_gateway')).toBe('mesh');
    expect(layerIcon('cilium_service')).toBe('mesh');
  });

  it('k8s / aws_eks → cluster', () => {
    expect(layerIcon('k8s')).toBe('cluster');
    expect(layerIcon('k8s_service')).toBe('cluster');
    expect(layerIcon('aws_eks')).toBe('cluster');
  });

  it('browser / ios / mini-programs → web', () => {
    expect(layerIcon('browser')).toBe('web');
    expect(layerIcon('ios')).toBe('web');
    expect(layerIcon('alipay_mini_program')).toBe('web');
    expect(layerIcon('wechat_mini_program')).toBe('web');
  });

  it('faas → fn', () => {
    expect(layerIcon('faas')).toBe('fn');
  });

  it('message-queue family → topic', () => {
    expect(layerIcon('virtual_mq')).toBe('topic');
    expect(layerIcon('kafka')).toBe('topic');
    expect(layerIcon('rocketmq')).toBe('topic');
    expect(layerIcon('rabbitmq')).toBe('topic');
    expect(layerIcon('pulsar')).toBe('topic');
    expect(layerIcon('activemq')).toBe('topic');
    expect(layerIcon('bookkeeper')).toBe('topic');
  });

  it('database family → db', () => {
    expect(layerIcon('virtual_database')).toBe('db');
    expect(layerIcon('mysql')).toBe('db');
    expect(layerIcon('postgresql')).toBe('db');
    expect(layerIcon('mongodb')).toBe('db');
    expect(layerIcon('clickhouse')).toBe('db');
    expect(layerIcon('elasticsearch')).toBe('db');
    expect(layerIcon('aws_dynamodb')).toBe('db');
  });

  it('cache family → cache', () => {
    expect(layerIcon('virtual_cache')).toBe('cache');
    expect(layerIcon('redis')).toBe('cache');
  });

  it('self-observability + agents → flame', () => {
    expect(layerIcon('so11y_oap')).toBe('flame');
    expect(layerIcon('so11y_satellite')).toBe('flame');
    expect(layerIcon('so11y_java_agent')).toBe('flame');
    expect(layerIcon('so11y_go_agent')).toBe('flame');
  });

  it('falls back to svc for unknown / non-family layers', () => {
    expect(layerIcon('apisix')).toBe('svc');
    expect(layerIcon('nginx')).toBe('svc');
    expect(layerIcon('flink')).toBe('svc');
    expect(layerIcon('os_linux')).toBe('svc');
  });

  it('precedence — mesh prefix wins over generic substrings', () => {
    // `mesh_cp` starts with `mesh`, so it picks `mesh` even though
    // the key also matches the substring `cp` (which isn't a mapping).
    expect(layerIcon('mesh_cp')).toBe('mesh');
  });
});

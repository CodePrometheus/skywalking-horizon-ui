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

/**
 * Icon mappers used by AppSidebar. Extracted from the component so
 * they can be unit-tested directly — the mappings encode our entire
 * layer / section taxonomy, and a wrong icon ships a confusing menu.
 */

import type { IconName } from '@/components/icons/Icon.vue';

/** Pick the L0 group-header icon for a given section label.
 *  Canonical sections (Overviews / Layers / Operate / …) get fixed
 *  icons; everything else falls through to a substring match against
 *  the known layer / family names. Default `dash`. */
export function sectionIcon(label: string): IconName {
  const k = label.toLowerCase();
  if (k === 'overviews' || k === 'overview') return 'dash';
  if (k === 'layers') return 'svc';
  if (k === 'platform monitoring') return 'flame';
  if (k === 'operate') return 'set';
  if (k === 'dashboard setup') return 'metric';
  if (k === 'admin') return 'user';
  if (k.startsWith('istio') || k.includes('mesh') || k.includes('envoy') || k.includes('cilium')) {
    return 'mesh';
  }
  if (k.includes('kubernetes') || k.includes('k8s') || k.includes('eks')) return 'cluster';
  if (k.includes('browser') || k.includes('rum') || k.includes('mini')) return 'web';
  if (k.includes('database') || k.includes('sql') || k.includes('mongo')) return 'db';
  if (k.includes('cache') || k.includes('redis')) return 'cache';
  if (k.includes('mq') || k.includes('kafka') || k.includes('queue')) return 'topic';
  if (k.includes('faas') || k.includes('function')) return 'fn';
  if (k.includes('aws') || k.includes('cloud')) return 'cluster';
  if (k.includes('agent') || k.includes('so11y') || k.includes('satellite')) return 'flame';
  return 'dash';
}

/** Pick the per-layer L1 icon from the layer key. Decoupled from
 *  `LayerDef` so the helper stays pure / testable; callers pass
 *  `layer.key` directly. */
export function layerIcon(layerKey: string): IconName {
  const k = layerKey.toLowerCase();
  if (k === 'general' || k === 'general_service') return 'sky';
  if (k.startsWith('mesh') || k.startsWith('istio') || k.startsWith('envoy') || k.startsWith('cilium')) {
    return 'mesh';
  }
  if (k.startsWith('k8s') || k === 'aws_eks') return 'cluster';
  if (k === 'browser' || k === 'ios' || k.includes('mini_program')) return 'web';
  if (k === 'faas') return 'fn';
  if (
    k === 'virtual_mq' || k === 'kafka' || k === 'rocketmq' || k === 'rabbitmq' ||
    k === 'pulsar' || k === 'activemq' || k === 'bookkeeper'
  ) {
    return 'topic';
  }
  if (
    k === 'virtual_database' || k === 'mysql' || k === 'postgresql' || k === 'mongodb' ||
    k === 'clickhouse' || k === 'elasticsearch' || k === 'aws_dynamodb'
  ) {
    return 'db';
  }
  if (k === 'virtual_cache' || k === 'redis') return 'cache';
  if (k.startsWith('so11y') || k.includes('agent') || k.includes('satellite')) return 'flame';
  return 'svc';
}

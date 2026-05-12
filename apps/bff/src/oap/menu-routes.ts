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

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type {
  FetchLike,
  LayerCaps,
  LayerDef,
  LayerSlots,
  MenuResponse,
} from '@skywalking-horizon-ui/api-client';
import type { ConfigSource } from '../config/loader.js';
import type { SessionStore } from '../auth/sessions.js';
import { requireAuth } from '../auth/middleware.js';
import { graphqlPost } from './graphql-client.js';

export interface MenuRouteDeps {
  config: ConfigSource;
  sessions: SessionStore;
  fetch?: FetchLike;
}

// One round-trip, three aliased queries.
const MENU_QUERY = /* GraphQL */ `
  query HorizonMenu {
    layers: listLayers
    items: getMenuItems {
      title
      icon
      layer
      activate
      description
      documentLink
      i18nKey
    }
    levels: listLayerLevels {
      layer
      level
    }
  }
`;

interface MenuRaw {
  layers: string[];
  items: Array<{
    title: string;
    icon?: string | null;
    layer: string;
    activate?: boolean | null;
    description?: string | null;
    documentLink?: string | null;
    i18nKey?: string | null;
  }>;
  levels: Array<{ layer: string; level: number }>;
}

/**
 * Horizon-side defaults for per-layer term aliases and color. OAP doesn't
 * expose these — they live alongside the UI's sidebar config. Operators can
 * override via `horizon.yaml.layers.<key>` (future Phase 7 admin).
 *
 * Keys match `Layer.name` in OAP's enum (UPPER_SNAKE_CASE).
 */
const LAYER_DEFAULTS: Record<string, { color: string; slots: LayerSlots; caps: LayerCaps }> = {
  GENERAL: {
    color: 'var(--sw-accent)',
    slots: { services: 'Services', instances: 'Instances', endpoints: 'API', endpointDependency: 'API dependency' },
    caps: {
      overview: true, serviceMap: true, endpointDependency: true, instanceTopology: true, processTopology: true,
      dashboards: true, traces: true, logs: true, profiling: true, events: true,
    },
  },
  MESH: {
    color: 'var(--sw-info)',
    slots: { services: 'Services', instances: 'Sidecars', endpoints: 'Endpoints' },
    caps: {
      overview: true, serviceMap: true, endpointDependency: true, instanceTopology: true,
      dashboards: true, traces: true, logs: true, events: true,
    },
  },
  MESH_CP: { color: 'var(--sw-info)', slots: { services: 'Control-plane services' }, caps: { overview: true, dashboards: true } },
  MESH_DP: { color: 'var(--sw-info)', slots: { services: 'Data-plane services', instances: 'Sidecars' }, caps: { overview: true, dashboards: true, instanceTopology: true } },
  K8S: { color: 'var(--sw-purple)', slots: { services: 'Workloads', instances: 'Pods' }, caps: { overview: true, serviceMap: true, instanceTopology: true, dashboards: true, events: true } },
  K8S_SERVICE: { color: 'var(--sw-purple)', slots: { services: 'K8s services', instances: 'Pods' }, caps: { overview: true, serviceMap: true, instanceTopology: true, dashboards: true } },
  BROWSER: { color: 'var(--sw-cyan)', slots: { services: 'Applications', instances: 'Versions', endpoints: 'Pages' }, caps: { overview: true, dashboards: true, traces: true, logs: true } },
  MYSQL: { color: 'var(--sw-warn)', slots: { services: 'Instances' }, caps: { overview: true, dashboards: true } },
  POSTGRESQL: { color: 'var(--sw-warn)', slots: { services: 'Instances' }, caps: { overview: true, dashboards: true } },
  ELASTICSEARCH: { color: 'var(--sw-warn)', slots: { services: 'Clusters', instances: 'Nodes' }, caps: { overview: true, dashboards: true } },
  REDIS: { color: 'var(--sw-warn)', slots: { services: 'Instances' }, caps: { overview: true, dashboards: true } },
  MONGODB: { color: 'var(--sw-warn)', slots: { services: 'Clusters', instances: 'Nodes' }, caps: { overview: true, dashboards: true } },
  CLICKHOUSE: { color: 'var(--sw-warn)', slots: { services: 'Services', instances: 'Instances' }, caps: { overview: true, dashboards: true } },
  KAFKA: { color: 'var(--sw-ok)', slots: { services: 'Clusters', instances: 'Brokers' }, caps: { overview: true, dashboards: true } },
  PULSAR: { color: 'var(--sw-ok)', slots: { services: 'Clusters', instances: 'Brokers' }, caps: { overview: true, dashboards: true } },
  ROCKETMQ: { color: 'var(--sw-ok)', slots: { services: 'Clusters', instances: 'Brokers', endpoints: 'Topics' }, caps: { overview: true, dashboards: true } },
  RABBITMQ: { color: 'var(--sw-ok)', slots: { services: 'Clusters', instances: 'Nodes' }, caps: { overview: true, dashboards: true } },
  ACTIVEMQ: { color: 'var(--sw-ok)', slots: { services: 'Clusters', instances: 'Brokers', endpoints: 'Destinations' }, caps: { overview: true, dashboards: true } },
  VIRTUAL_DATABASE: { color: 'var(--sw-warn)', slots: { services: 'Databases' }, caps: { overview: true, dashboards: true } },
  VIRTUAL_CACHE: { color: 'var(--sw-warn)', slots: { services: 'Caches' }, caps: { overview: true, dashboards: true } },
  VIRTUAL_MQ: { color: 'var(--sw-ok)', slots: { services: 'Queues' }, caps: { overview: true, dashboards: true } },
  VIRTUAL_GENAI: { color: 'var(--sw-purple)', slots: { services: 'Providers', instances: 'Models' }, caps: { overview: true, dashboards: true } },
};

const DEFAULT_FOR_UNKNOWN_LAYER = {
  color: 'var(--sw-fg-2)',
  slots: { services: 'Services' } as LayerSlots,
  caps: { overview: true, dashboards: true } as LayerCaps,
};

function deriveLayer(
  rawKey: string,
  active: boolean,
  level: number | null,
  items: MenuRaw['items'],
): LayerDef {
  const item = items.find((i) => i.layer === rawKey);
  const def = LAYER_DEFAULTS[rawKey] ?? DEFAULT_FOR_UNKNOWN_LAYER;
  return {
    key: rawKey.toLowerCase(),
    name: item?.title?.trim() || rawKey.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    color: def.color,
    serviceCount: -1, // Phase 2.x will fold in `listServices(layer)` counts.
    active,
    level,
    documentLink: item?.documentLink ?? undefined,
    slots: def.slots,
    caps: def.caps,
  };
}

export function registerMenuRoute(app: FastifyInstance, deps: MenuRouteDeps): void {
  const auth = requireAuth(deps);
  app.get('/api/menu', { preHandler: auth }, async (_req: FastifyRequest, reply: FastifyReply) => {
    const cfg = deps.config.current;
    const statusUrl = cfg.oap.statusUrl;
    try {
      const raw = await graphqlPost<MenuRaw>(
        { statusUrl, timeoutMs: cfg.oap.timeoutMs, fetch: deps.fetch },
        MENU_QUERY,
      );
      const levelByLayer = new Map(raw.levels.map((l) => [l.layer, l.level]));
      const allKeys = new Set<string>([
        ...raw.layers,
        ...raw.items.map((i) => i.layer),
      ]);
      const layers = [...allKeys]
        .map((key) =>
          deriveLayer(
            key,
            raw.layers.includes(key),
            levelByLayer.has(key) ? (levelByLayer.get(key) ?? null) : null,
            raw.items,
          ),
        )
        .sort((a, b) => {
          // Active layers first, then by name. UI re-sorts as needed.
          if (a.active !== b.active) return a.active ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      const body: MenuResponse = {
        layers,
        generatedAt: Date.now(),
        oap: { reachable: true, statusUrl },
      };
      return reply.send(body);
    } catch (err) {
      const body: MenuResponse = {
        layers: [],
        generatedAt: Date.now(),
        oap: {
          reachable: false,
          statusUrl,
          error: err instanceof Error ? err.message : String(err),
        },
      };
      return reply.status(200).send(body); // soft-fail so the UI shows a banner, not a 5xx
    }
  });
}

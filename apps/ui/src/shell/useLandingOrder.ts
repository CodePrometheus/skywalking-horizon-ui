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

import { computed, type ComputedRef } from 'vue';
import type { LayerDef } from '@skywalking-horizon-ui/api-client';
import { useSetupStore } from '@/state/setup';

/**
 * Sort layers by `landing.priority` (lower first). Ties break by the OAP
 * catalog order already present in `layers` (since the BFF returned them
 * that way). Lazy-creates a default config for each layer the user hasn't
 * touched, using `defaultPriority` baked into the setup store.
 *
 * Used by BOTH the Overview page (card order) and the sidebar's Layers
 * section (row order) so the two stay in lockstep.
 */
export function useLandingOrder(layers: ComputedRef<readonly LayerDef[]>) {
  const store = useSetupStore();
  return computed<LayerDef[]>(() => {
    return [...layers.value].sort((a, b) => {
      const pa = store.ensure(a.key, { slots: a.slots, caps: a.caps, metrics: a.metrics, overview: a.overview }).landing.priority;
      const pb = store.ensure(b.key, { slots: b.slots, caps: b.caps, metrics: b.metrics, overview: b.overview }).landing.priority;
      if (pa !== pb) return pa - pb;
      return 0; // preserve incoming catalog order
    });
  });
}

// (Removed `useLandingLayers` — every available layer is automatically on
// the landing. The Overview just consumes `useLandingOrder(availableLayers)`
// directly.)

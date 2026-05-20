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

import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import type { OapConfigResponse } from '@skywalking-horizon-ui/api-client';
import { bffClient } from '@/api/client';

/** Live OAP runtime-config dump (`/debugging/config/dump`). Only changes
 *  on OAP restart, so polled lazily; the page exposes a manual refresh. */
export function useOapConfig() {
  const q = useQuery({
    queryKey: ['oap-config'],
    queryFn: () => bffClient.oapOps.config(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const data = computed<OapConfigResponse | null>(() => q.data.value ?? null);
  const reachable = computed<boolean>(() => data.value?.reachable ?? false);
  const entries = computed(() => data.value?.entries ?? []);

  return {
    isLoading: q.isLoading,
    data,
    reachable,
    entries,
    refetch: q.refetch,
  };
}

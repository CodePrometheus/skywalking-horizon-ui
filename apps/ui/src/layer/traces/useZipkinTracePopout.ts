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
 * URL-backed popout state for Zipkin traces. Mirrors `useTracePopout`
 * (the native popout) but reads/writes `?openZipkinTraceId=<id>` so
 * the two trace kinds can be open simultaneously without colliding.
 */

import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useZipkinTracePopout() {
  const route = useRoute();
  const router = useRouter();

  const openTraceId = computed<string | null>(() => {
    const v = route.query.openZipkinTraceId;
    return typeof v === 'string' && v.length > 0 ? v : null;
  });

  function openTrace(id: string): void {
    if (!id) return;
    const next = { ...route.query, openZipkinTraceId: id };
    void router.replace({ path: route.path, query: next });
  }

  function closeTrace(): void {
    if (!openTraceId.value) return;
    const next = { ...route.query };
    delete next.openZipkinTraceId;
    void router.replace({ path: route.path, query: next });
  }

  return { openTraceId, openTrace, closeTrace };
}

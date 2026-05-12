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
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Icon from '@/components/icons/Icon.vue';

const route = useRoute();

// Trivial breadcrumb derivation from the path. Real breadcrumb metadata
// lands when individual views start setting `route.meta.breadcrumbs`.
const crumbs = computed<string[]>(() => {
  const segs = route.path.split('/').filter(Boolean);
  if (segs.length === 0) return ['Home'];
  return segs.map((s) => s.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()));
});
</script>

<template>
  <header class="sw-top">
    <div class="sw-crumbs">
      <template v-for="(c, i) in crumbs" :key="i">
        <Icon v-if="i > 0" name="chev" :size="10" />
        <b v-if="i === crumbs.length - 1">{{ c }}</b>
        <span v-else>{{ c }}</span>
      </template>
    </div>
    <div class="sw-top-search">
      <Icon name="search" :size="12" />
      <span>Search services, endpoints, traceId&hellip;</span>
      <kbd>⌘K</kbd>
    </div>
    <div class="sw-top-actions">
      <div class="sw-btn">
        <span style="color: var(--sw-fg-2)">env</span>
        <b style="color: var(--sw-fg-0)">production</b>
        <Icon name="caret" :size="10" />
      </div>
      <div class="sw-btn">
        <Icon name="clock" :size="12" />
        <span>Last 30 minutes</span>
        <Icon name="caret" :size="10" />
      </div>
      <div class="sw-btn is-icon"><Icon name="refresh" :size="12" /></div>
      <div class="sw-btn is-icon"><Icon name="bell" :size="12" /></div>
    </div>
  </header>
</template>

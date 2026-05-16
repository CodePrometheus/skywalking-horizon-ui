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
  A single row in the recursive profile stack table. Recursion is what
  forces this to be its own component; the parent table renders one
  ProfileStackRow per root and lets each row paint its own subtree.
-->
<script setup lang="ts">
import { ref } from 'vue';
import type { ProfileAnalyzationElement } from '@/api/client';

interface StackNode extends ProfileAnalyzationElement {
  topDur: boolean;
  children?: StackNode[];
}

const props = defineProps<{
  node: StackNode;
  thread: number;
  depth: number;
}>();

const open = ref(true);
const indent = props.depth * 12;
</script>

<template>
  <div class="row">
    <div
      class="cell sig"
      :style="{ width: thread + 'px', paddingLeft: 8 + indent + 'px' }"
      :class="{ 'is-top': node.topDur, 'is-root': node.parentId === '0' }"
    >
      <span
        v-if="node.children && node.children.length"
        class="caret"
        :class="{ open }"
        @click="open = !open"
      >▸</span>
      <span v-else class="caret-spacer"></span>
      <span class="sig-text" :title="node.codeSignature">{{ node.codeSignature }}</span>
    </div>
    <div class="cell num">{{ node.duration }}</div>
    <div class="cell num self">{{ node.durationChildExcluded }}</div>
    <div class="cell num">{{ node.count }}</div>
  </div>
  <template v-if="open && node.children">
    <ProfileStackRow
      v-for="(c, i) in node.children"
      :key="'c' + i"
      :node="c"
      :thread="thread"
      :depth="depth + 1"
    />
  </template>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  border-bottom: 1px dotted var(--sw-line);
}
.row:hover {
  background: var(--sw-bg-2);
}
.cell {
  height: 26px;
  line-height: 26px;
  padding: 0 8px;
  border-right: 1px dotted var(--sw-line-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cell.num {
  width: 140px;
  flex: 0 0 140px;
  text-align: right;
  color: var(--sw-fg-2);
}
.cell.num.self {
  color: var(--sw-fg-1);
  font-weight: 600;
}
.cell.sig {
  flex: 0 0 auto;
  color: var(--sw-fg-1);
  display: flex;
  align-items: center;
  gap: 4px;
}
.cell.sig.is-top {
  color: var(--sw-accent);
}
.cell.sig.is-root {
  background: var(--sw-bg-2);
  border-left: 3px solid var(--sw-accent);
  padding-left: 5px !important;
}
.caret {
  width: 12px;
  display: inline-block;
  transition: transform 0.15s;
  color: var(--sw-fg-3);
  cursor: pointer;
  user-select: none;
}
.caret.open {
  transform: rotate(90deg);
}
.caret-spacer {
  width: 12px;
  display: inline-block;
}
.sig-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

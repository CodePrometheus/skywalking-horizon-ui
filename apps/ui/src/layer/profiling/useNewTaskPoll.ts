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
 * Shared "create-then-poll" helper for every profiling task family
 * (trace / async / eBPF cpu / eBPF network / pprof). OAP acks a task
 * creation before the task is queryable — the task has to propagate to
 * the task-list query, which can take several seconds. So after a create
 * we refresh the list repeatedly until the new task shows up rather than
 * leaving the operator looking at the stale pre-create list.
 *
 * Detection is id-based: capture the visible task ids *before* the create,
 * then after each refresh look for any id that wasn't there before. That
 * covers both "empty → first task" and "a newer task appended on top of
 * existing ones", without depending on per-family timestamp field names.
 */

import { ref } from 'vue';

export const POLL_ROUNDS = 4;
export const POLL_INTERVAL_MS = 10_000;

export function useNewTaskPoll() {
  /** True while the post-create poll is running. */
  const polling = ref(false);
  /** 1-based round currently in flight (0 when idle). */
  const pollRound = ref(0);

  async function pollForNewTask(opts: {
    /** Task ids visible before the create call. */
    idsBefore: Set<string>;
    /** Reload the task list (the view's existing refresh). */
    refresh: () => Promise<void>;
    /** Task ids visible right now (read after each refresh). */
    currentIds: () => string[];
  }): Promise<boolean> {
    const appeared = (): boolean => opts.currentIds().some((id) => !opts.idsBefore.has(id));
    // The view typically refreshes once right after create; if the task
    // is already visible, don't spin the poll at all.
    if (appeared()) return true;
    polling.value = true;
    try {
      for (let i = 1; i <= POLL_ROUNDS; i++) {
        pollRound.value = i;
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        await opts.refresh();
        if (appeared()) return true;
      }
      return false;
    } finally {
      polling.value = false;
      pollRound.value = 0;
    }
  }

  return { polling, pollRound, pollForNewTask };
}

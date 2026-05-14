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
 * Service-name group parsing. OAP encodes a group prefix with `::` —
 * e.g. `agent::songs`, `mesh::checkout`. The prefix is a deployment
 * grouping (k8s namespace, fleet, source) that operators want surfaced
 * as a separate visual element rather than crowded into the service
 * name itself.
 *
 * Rendering rule applied everywhere across the UI:
 *   - Service lists / pickers / KPI strips → render `<group-chip> <base-name>`
 *     so the group reads as a category tag and the eye lands on the base name
 *   - Topology nodes → render `base` only, with the group available in hover
 *     / detail panels (the SVG label area is too tight for both)
 *
 * Multiple `::` segments collapse to: first segment = group, remainder = base
 * (so `eu::prod::checkout` → group: `eu`, base: `prod::checkout`).
 */
export interface ParsedServiceName {
  /** Group prefix when the raw name contains `::`. */
  group: string | null;
  /** Service name with the `<group>::` prefix stripped; equal to `raw`
   *  when there is no group. */
  base: string;
  /** Original full name (echoed so callers don't have to keep it around). */
  raw: string;
}

export function parseServiceName(raw: string | null | undefined): ParsedServiceName {
  const r = raw ?? '';
  const idx = r.indexOf('::');
  if (idx <= 0) return { group: null, base: r, raw: r };
  return { group: r.slice(0, idx), base: r.slice(idx + 2), raw: r };
}

/** Display helper — base only. Use in tight spots (graph nodes, chips). */
export function serviceBaseName(raw: string | null | undefined): string {
  return parseServiceName(raw).base;
}

/** Display helper — group only (null when no group). Renderers should
 *  treat null as "no group chip". */
export function serviceGroupName(raw: string | null | undefined): string | null {
  return parseServiceName(raw).group;
}

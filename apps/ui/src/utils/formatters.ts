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
 * Compact-readable formatter for landing-card numeric cells.
 *
 * Rules:
 *   - `null` / `undefined` / NaN → `'—'` (so the column stays aligned).
 *   - Integers under 10k render bare (`1234`).
 *   - Larger values use SI suffixes (`12.3k`, `1.2M`).
 *   - Sub-1 values render at 2 decimals (`0.42`).
 *   - Everything else uses 1 decimal (`12.3`, `999.0`).
 *
 * Matches the booster-ui KPI tile feel without dragging in a date/number
 * library — the landing card is the only place this is used today.
 */
export function fmtMetric(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(v / 1_000).toFixed(1)}k`;
  if (abs >= 1) return abs < 100 ? v.toFixed(1) : Math.round(v).toString();
  if (abs === 0) return '0';
  return v.toFixed(2);
}

/**
 * Format variant honoring an explicit widget / metric `format` hint.
 *
 *   - `'int'`     → round to nearest integer (`8` not `8.0`). Still SI-
 *                   suffixed for large values (`12k`, `1M`) — operators
 *                   never want a literal `1234567` in a card.
 *   - `'decimal'` → always one decimal place, no SI.
 *   - `'compact'` / undefined → defer to {@link fmtMetric}.
 *
 * Used by metrics that are intrinsically integral (pod count, replica
 * count) or that need a known number of decimals (latency targets at
 * 3-decimal precision, say). The `format` field rides on
 * `DashboardWidget` so it's part of the bundled layer JSON.
 */
export type MetricFormat = 'int' | 'decimal' | 'compact';
export function fmtMetricAs(
  v: number | null | undefined,
  format: MetricFormat | undefined,
): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (format === 'int') {
    const abs = Math.abs(v);
    if (abs >= 1_000_000_000) return `${Math.round(v / 1_000_000_000)}B`;
    if (abs >= 1_000_000) return `${Math.round(v / 1_000_000)}M`;
    if (abs >= 10_000) return `${Math.round(v / 1_000)}k`;
    return Math.round(v).toString();
  }
  if (format === 'decimal') {
    return v.toFixed(1);
  }
  return fmtMetric(v);
}

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
 * Per-layer dashboard wire types.
 *
 * The Dashboards tab on each layer page renders a grid of widgets. Each
 * widget is one or more MQE expressions plus presentation hints (chart
 * type, unit, position in a 24-column grid — mirrors booster-ui's
 * grid units for visual parity).
 *
 * Defaults per layer are seeded from `apps/bff/src/dashboard/defaults.ts`
 * — those defaults are lifted from the equivalent booster-ui templates
 * so the metric coverage matches what operators expect on day one.
 * Phase 7 admin lets operators edit + persist their own widget set.
 */

export type DashboardWidgetType = 'card' | 'line';

export interface DashboardWidget {
  /** Stable id within the layer's dashboard. */
  id: string;
  title: string;
  /** Hover tip — typically the booster-ui `widget.tips`. */
  tip?: string;
  type: DashboardWidgetType;
  /** One or more MQE expressions. `card` collapses to a scalar (avg);
   *  `line` renders one labeled series per expression. */
  expressions: string[];
  /** Suffix unit (`%`, `ms`, `calls / min`). */
  unit?: string;
  /** 24-column grid coordinates — operator can re-layout later. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardConfig {
  /** Layer enum (UPPER_SNAKE). */
  layer: string;
  /** Widget set. Order is irrelevant — grid coords drive placement. */
  widgets: DashboardWidget[];
}

export interface DashboardSeries {
  label: string;
  data: Array<number | null>;
}

export interface DashboardWidgetResult {
  id: string;
  /** Set when every MQE expression for this widget errored. */
  error?: string;
  /** `card` payload — single scalar (avg across the time window). */
  value?: number | null;
  /** `line` payload — one entry per expression. */
  series?: DashboardSeries[];
}

export interface DashboardResponse {
  layer: string;
  /** Service name the widgets were scoped to. `null` for layer-wide. */
  service: string | null;
  generatedAt: number;
  step: 'MINUTE' | 'HOUR' | 'DAY';
  durationStart: string;
  durationEnd: string;
  widgets: DashboardWidgetResult[];
  reachable: boolean;
  error?: string;
}

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

import type {
  DashboardConfig,
  DashboardResponse,
  DashboardWidget,
  EndpointDependencyConfig,
  EndpointDependencyResponse,
  LandingConfig,
  LandingResponse,
  LogFacetsResponse,
  LogQueryRequest,
  LogsResponse,
  MenuResponse,
  OapInfo,
  ProfileAnalyzationResponse,
  ProfileAnalyzeQuery,
  ProfileSegmentsResponse,
  ProfileTaskCreationRequest,
  ProfileTaskCreationResponse,
  ProfileTaskListResponse,
  ProfileTaskLogsResponse,
  EBPFTaskListResponse,
  EBPFTaskCreationRequest,
  EBPFTaskCreationResponse,
  EBPFSchedulesResponse,
  EBPFAnalyzeRequest,
  EBPFAnalyzeResponse,
  ProcessTopologyResponse,
  NetworkProfilingCreateRequest,
  NetworkProfilingCreateResponse,
  NetworkProfilingKeepAliveResponse,
  AsyncProfilingTaskListResponse,
  AsyncProfilingTaskCreationRequest,
  AsyncProfilingTaskCreationResponse,
  AsyncProfilingProgressResponse,
  AsyncProfilingAnalyzeResponse,
  PprofTaskListResponse,
  PprofTaskCreationRequest,
  PprofTaskCreationResponse,
  PprofProgressResponse,
  PprofAnalyzeResponse,
  SetupResponse,
  SetupSavePayload,
  TopologyConfig,
  TopologyResponse,
  TraceDetailResponse,
  TraceListResponse,
  TraceQueryOrder,
  TraceQueryState,
  TraceSource,
  TracesConfig,
  ZipkinTraceListResponse,
  ZipkinTraceDetailResponse,
} from '@skywalking-horizon-ui/api-client';

/** Query shape for `/api/zipkin/traces`. Mirrors the Zipkin v2 REST
 *  params Zipkin's UI uses — all optional, `endTs` defaults to now and
 *  `lookback` to 30 min (ms) server-side. */
export interface ZipkinTraceQuery {
  serviceName?: string;
  remoteServiceName?: string;
  spanName?: string;
  annotationQuery?: string;
  /** microseconds */
  minDuration?: number;
  /** microseconds */
  maxDuration?: number;
  /** ms since epoch */
  endTs?: number;
  /** ms */
  lookback?: number;
  limit?: number;
}

export type {
  MenuResponse,
  LayerDef,
  LayerCaps,
  LayerSlots,
  OapInfo,
  SetupResponse,
  SetupSavePayload,
  LayerConfig,
  LandingConfig,
  LandingColumn,
  LandingResponse,
  LandingServiceRow,
  DashboardConfig,
  DashboardResponse,
  DashboardWidget,
  DashboardWidgetResult,
  TopologyMetricDef,
  TopologyConfig,
  EndpointDependencyConfig,
  TopologyNode,
  TopologyCall,
  TopologyResponse,
  EndpointDependencyNode,
  EndpointDependencyCall,
  EndpointDependencyResponse,
  TraceSource,
  TracesConfig,
  TraceKeyValue,
  TraceLogEntry,
  TraceAttachedEvent,
  TraceRef,
  NativeSpan,
  NativeTraceListRow,
  NativeTraceListResponse,
  NativeTraceDetailResponse,
  TraceQueryOrder,
  TraceQueryState,
  ZipkinEndpoint,
  ZipkinAnnotation,
  ZipkinKind,
  ZipkinSpan,
  ZipkinTraceListRow,
  ZipkinTraceListResponse,
  ZipkinTraceDetailResponse,
  TraceListResponse,
  TraceDetailResponse,
  LogKeyValue,
  LogRow,
  LogTagFilter,
  LogQueryRequest,
  LogsResponse,
  LogFacetsResponse,
  ProfileTask,
  ProfileTaskLog,
  ProfileTaskListResponse,
  ProfileTaskLogsResponse,
  ProfileSpan,
  ProfileSpanRef,
  ProfileSpanTag,
  ProfileSpanLog,
  ProfileSpanLogData,
  ProfileSegment,
  ProfileSegmentsResponse,
  ProfileAnalyzationElement,
  ProfileAnalyzationTree,
  ProfileAnalyzationResponse,
  ProfileTimeRange,
  ProfileAnalyzeQuery,
  ProfileTaskCreationRequest,
  ProfileTaskCreationResponse,
  EBPFTargetType,
  EBPFTriggerType,
  EBPFAggregateType,
  EBPFTask,
  EBPFProcess,
  EBPFSchedule,
  EBPFStackElement,
  EBPFAnalysisTree,
  EBPFTaskCreationRequest,
  EBPFTaskCreationResult,
  EBPFTaskListResponse,
  EBPFSchedulesResponse,
  EBPFAnalyzeRequest,
  EBPFAnalyzeResponse,
  EBPFTaskCreationResponse,
  ProcessNode,
  ProcessCall,
  ProcessTopologyResponse,
  NetworkProfilingSampling,
  NetworkProfilingCreateRequest,
  NetworkProfilingCreateResponse,
  NetworkProfilingKeepAliveResponse,
  AsyncProfilingEvent,
  AsyncJFREventType,
  AsyncProfilingTask,
  AsyncProfilingProgressLog,
  AsyncProfilingProgress,
  AsyncProfilingStackElement,
  AsyncProfilingTree,
  AsyncProfilingTaskCreationRequest,
  AsyncProfilingTaskListResponse,
  AsyncProfilingProgressResponse,
  AsyncProfilingAnalyzeResponse,
  AsyncProfilingTaskCreationResponse,
  PprofTask,
  PprofProgress,
  PprofStackElement,
  PprofTree,
  PprofTaskCreationRequest,
  PprofTaskListResponse,
  PprofProgressResponse,
  PprofAnalyzeResponse,
  PprofTaskCreationResponse,
} from '@skywalking-horizon-ui/api-client';


export interface MeResponse {
  username: string;
  roles: string[];
  verbs: string[];
}

/** Wire shape returned by GET /api/admin/layer-templates. */
export interface AdminLayerTemplate {
  key: string;
  alias?: string;
  color?: string;
  documentLink?: string;
  slots: { services?: string; instances?: string; endpoints?: string; endpointDependency?: string };
  components: {
    service?: boolean;
    instances?: boolean;
    endpoints?: boolean;
    endpointDependency?: boolean;
    topology?: boolean;
    traces?: boolean;
    logs?: boolean;
    profiling?: boolean;
    traceProfiling?: boolean;
    ebpfProfiling?: boolean;
    asyncProfiling?: boolean;
  };
  metrics: {
    orderBy?: string;
    columns?: Array<{
      metric: string;
      label: string;
      unit?: string;
      mqe?: string;
      aggregation?: 'sum' | 'avg';
      scale?: number;
      precision?: number;
    }>;
  };
  overview?: {
    throughput?: string;
    spark?: string;
  };
  widgets: DashboardWidget[];
  /** Operator-editable service-map config — node + server + client
   *  metric definitions, with optional thresholds. */
  topology?: TopologyConfig;
  /** Operator-editable API-dependency config — node + server-side line
   *  metrics (OAP has no client family for endpoint relations). */
  endpointDependency?: EndpointDependencyConfig;
  /** Per-layer trace source default. */
  traces?: TracesConfig;
  /** Service-name parsing rule for the topology cluster feature.
   *  See `ServiceNamingRule` in @skywalking-horizon-ui/api-client. */
  naming?: {
    pattern: string;
    flags?: string;
    displayGroup?: string;
    valueGroup?: string;
    alias: string;
  };
}

export class BffApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'BffApiError';
    this.status = status;
    this.body = body;
  }
}

type On401 = () => void;

export class BffClient {
  private on401: On401 | null = null;

  setOn401(fn: On401): void {
    this.on401 = fn;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const init: RequestInit = {
      method,
      credentials: 'include',
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
    };
    if (body !== undefined) init.body = JSON.stringify(body);
    const res = await fetch(path, init);
    if (res.status === 401) {
      this.on401?.();
      throw new BffApiError(401, 'unauthenticated', null);
    }
    if (!res.ok) {
      let parsed: unknown = null;
      try {
        parsed = await res.json();
      } catch {
        parsed = await res.text();
      }
      throw new BffApiError(res.status, `${method} ${path} failed (${res.status})`, parsed);
    }
    if (res.status === 204) return undefined as T;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return (await res.json()) as T;
    return (await res.text()) as unknown as T;
  }

  // ── auth ─────────────────────────────────────────────────────────────
  login(username: string, password: string): Promise<MeResponse> {
    return this.request<MeResponse>('POST', '/api/auth/login', { username, password });
  }

  logout(): Promise<{ status: 'ok' }> {
    return this.request<{ status: 'ok' }>('POST', '/api/auth/logout');
  }

  me(): Promise<MeResponse> {
    return this.request<MeResponse>('GET', '/api/auth/me');
  }

  // ── menu / layers ────────────────────────────────────────────────────
  menu(): Promise<MenuResponse> {
    return this.request<MenuResponse>('GET', '/api/menu');
  }

  oapInfo(): Promise<OapInfo> {
    return this.request<OapInfo>('GET', '/api/oap/info');
  }

  // ── setup (per-layer overrides) ──────────────────────────────────────
  loadSetup(): Promise<SetupResponse> {
    return this.request<SetupResponse>('GET', '/api/setup');
  }

  saveSetup(payload: SetupSavePayload): Promise<SetupResponse> {
    return this.request<SetupResponse>('POST', '/api/setup', payload);
  }

  // ── landing (per-layer top-N) ────────────────────────────────────────
  layerLanding(layerKey: string, cfg: LandingConfig): Promise<LandingResponse> {
    // The wire payload mirrors LandingConfig minus the priority/style
    // bits the BFF doesn't care about.
    const body = {
      topN: cfg.topN,
      orderBy: cfg.orderBy,
      columns: cfg.columns,
      ...(cfg.spark ? { spark: cfg.spark } : {}),
      ...(cfg.throughput ? { throughput: cfg.throughput } : {}),
    };
    return this.request<LandingResponse>(
      'POST',
      `/api/layer/${encodeURIComponent(layerKey)}/landing`,
      body,
    );
  }

  // ── dashboards (per-layer widget data) ───────────────────────────────
  dashboardConfig(layerKey: string, scope?: string): Promise<DashboardConfig> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return this.request<DashboardConfig>(
      'GET',
      `/api/layer/${encodeURIComponent(layerKey)}/dashboard/config${qs}`,
    );
  }
  dashboard(
    layerKey: string,
    body: {
      service?: string;
      /** Active instance name. When set with `scope === 'instance'`,
       *  the BFF flips each widget's MQE entity to ServiceInstance. */
      serviceInstance?: string;
      /** Active endpoint name. When set with `scope === 'endpoint'`,
       *  the BFF flips each widget's MQE entity to Endpoint. */
      endpoint?: string;
      widgets?: DashboardWidget[];
      scope?: string;
    } = {},
    /** Dev-mode mock: pad every TopList result to N entries with
     *  synthetic rows so operators can verify widget sizing without
     *  waiting for live data. Forwarded as `?mockTop=N`. */
    opts: { mockTop?: number } = {},
  ): Promise<DashboardResponse> {
    const qs = opts.mockTop && opts.mockTop > 0 ? `?mockTop=${opts.mockTop}` : '';
    return this.request<DashboardResponse>(
      'POST',
      `/api/layer/${encodeURIComponent(layerKey)}/dashboard${qs}`,
      body,
    );
  }
  /** Top-N endpoint search for a service. The per-layer Endpoint
   *  dashboard's picker calls this with the operator's search term;
   *  endpoints are unbounded by nature so we don't page through them.
   *  `limit` is clamped 20…50 by the BFF. */
  layerEndpoints(
    layerKey: string,
    service: string,
    query: string,
    limit = 20,
  ): Promise<{
    layer: string;
    service: string;
    query: string;
    limit: number;
    generatedAt: number;
    endpoints: Array<{ id: string; name: string }>;
    reachable: boolean;
    error?: string;
  }> {
    const qs = new URLSearchParams({
      service,
      q: query,
      limit: String(limit),
    });
    return this.request(
      'GET',
      `/api/layer/${encodeURIComponent(layerKey)}/endpoints?${qs.toString()}`,
    );
  }

  /** Service-map feed for the per-layer Topology tab. Returns the
   *  service neighbourhood centred on `service` (or the whole layer
   *  if omitted), each real node decorated with cpm / resp_time / sla.
   *  Depth controls BFS expansion (1…3); the operator can ratchet
   *  this up to inspect indirect callers. */
  layerTopology(layerKey: string, service?: string, depth = 1): Promise<TopologyResponse> {
    const qs = new URLSearchParams();
    if (service) qs.set('service', service);
    qs.set('depth', String(depth));
    return this.request(
      'GET',
      `/api/layer/${encodeURIComponent(layerKey)}/topology?${qs.toString()}`,
    );
  }

  /** API-dependency feed. Resolves `endpoint` (name or id) to an
   *  endpoint id via findEndpoint, then walks
   *  `getEndpointDependencies` to surface upstream callers and
   *  downstream callees with per-node MQE. */
  layerEndpointDependency(
    layerKey: string,
    service: string,
    endpoint: string,
  ): Promise<EndpointDependencyResponse> {
    const qs = new URLSearchParams({ service, endpoint });
    return this.request(
      'GET',
      `/api/layer/${encodeURIComponent(layerKey)}/endpoint-dependency?${qs.toString()}`,
    );
  }

  /** List traces — fans out to SW-native and / or Zipkin based on
   *  the layer's config and the operator's override. */
  layerTraces(
    layerKey: string,
    body: {
      source?: TraceSource;
      service?: string;
      serviceId?: string;
      instanceId?: string;
      endpointId?: string;
      traceId?: string;
      traceState?: TraceQueryState;
      queryOrder?: TraceQueryOrder;
      minTraceDuration?: number;
      maxTraceDuration?: number;
      pageNum?: number;
      pageSize?: number;
      tags?: Array<{ key: string; value: string }>;
      windowMinutes?: number;
      start?: string;
      end?: string;
    } = {},
  ): Promise<TraceListResponse> {
    return this.request<TraceListResponse>(
      'POST',
      `/api/layer/${encodeURIComponent(layerKey)}/traces`,
      body,
    );
  }

  /** Trace detail by id. `source=zipkin` swaps to the Zipkin REST
   *  path; default is native (v2/v3 picked automatically). */
  traceDetail(traceId: string, source: 'native' | 'zipkin' = 'native'): Promise<TraceDetailResponse> {
    const qs = new URLSearchParams({ source });
    return this.request<TraceDetailResponse>(
      'GET',
      `/api/trace/${encodeURIComponent(traceId)}?${qs.toString()}`,
    );
  }

  /** Log query — body shape mirrors OAP's `LogQueryCondition`. */
  layerLogs(layerKey: string, body: LogQueryRequest & { service?: string } = {}): Promise<LogsResponse> {
    return this.request<LogsResponse>(
      'POST',
      `/api/layer/${encodeURIComponent(layerKey)}/logs`,
      body,
    );
  }

  /** Tag autocomplete — list known tag keys for the duration window. */
  traceTagKeys(windowMinutes: number = 30): Promise<{ keys: string[]; generatedAt: number; error?: string }> {
    return this.request('GET', `/api/trace-tags/keys?windowMinutes=${windowMinutes}`);
  }
  /** Tag autocomplete — list values for a specific key. */
  traceTagValues(
    key: string,
    windowMinutes: number = 30,
  ): Promise<{ key: string; values: string[]; generatedAt: number; error?: string }> {
    return this.request(
      'GET',
      `/api/trace-tags/values?key=${encodeURIComponent(key)}&windowMinutes=${windowMinutes}`,
    );
  }

  /** Log facets — same body as `layerLogs`, but returns aggregated
   *  level + service counts across a larger window-scoped sample. */
  layerLogFacets(
    layerKey: string,
    body: LogQueryRequest & { service?: string; sampleSize?: number } = {},
  ): Promise<LogFacetsResponse> {
    return this.request<LogFacetsResponse>(
      'POST',
      `/api/layer/${encodeURIComponent(layerKey)}/logs/facets`,
      body,
    );
  }

  /** Log tag autocomplete — list known tag keys for a recent log
   *  window. Wraps OAP's `queryLogTagAutocompleteKeys`. */
  logTagKeys(
    windowMinutes: number = 30,
  ): Promise<{ keys: string[]; generatedAt: number; error?: string }> {
    return this.request('GET', `/api/log-tags/keys?windowMinutes=${windowMinutes}`);
  }
  /** Log tag autocomplete — list values for a specific key. Wraps
   *  OAP's `queryLogTagAutocompleteValues`. */
  logTagValues(
    key: string,
    windowMinutes: number = 30,
  ): Promise<{ key: string; values: string[]; generatedAt: number; error?: string }> {
    return this.request(
      'GET',
      `/api/log-tags/values?key=${encodeURIComponent(key)}&windowMinutes=${windowMinutes}`,
    );
  }

  // ── Zipkin trace endpoints (proxied to OAP's ZipkinQueryHandler) ──
  /** List services known to OAP's Zipkin store. */
  zipkinServices(): Promise<string[]> {
    return this.request('GET', '/api/zipkin/services');
  }
  /** List span names for a Zipkin service. */
  zipkinSpans(serviceName: string): Promise<string[]> {
    return this.request('GET', `/api/zipkin/spans?serviceName=${encodeURIComponent(serviceName)}`);
  }
  /** List remote (peer) services seen by a Zipkin service. */
  zipkinRemoteServices(serviceName: string): Promise<string[]> {
    return this.request('GET', `/api/zipkin/remote-services?serviceName=${encodeURIComponent(serviceName)}`);
  }
  /** Search Zipkin traces. Mirrors Zipkin v2 `/api/v2/traces`. */
  zipkinTraces(q: ZipkinTraceQuery = {}): Promise<ZipkinTraceListResponse> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (v === undefined || v === null || v === '') continue;
      params.set(k, String(v));
    }
    const qs = params.toString();
    return this.request<ZipkinTraceListResponse>('GET', `/api/zipkin/traces${qs ? '?' + qs : ''}`);
  }
  /** Fetch a single Zipkin trace by id. */
  zipkinTrace(traceId: string): Promise<ZipkinTraceDetailResponse> {
    return this.request<ZipkinTraceDetailResponse>('GET', `/api/zipkin/trace/${encodeURIComponent(traceId)}`);
  }
  /** Zipkin annotation autocomplete — keys configured on the OAP
   *  side (`/api/v2/autocompleteKeys`). */
  zipkinAutocompleteKeys(): Promise<string[]> {
    return this.request<string[]>('GET', '/api/zipkin/autocomplete/keys');
  }
  /** Zipkin annotation autocomplete — values for one key
   *  (`/api/v2/autocompleteValues?key=...`). */
  zipkinAutocompleteValues(key: string): Promise<string[]> {
    return this.request<string[]>(
      'GET',
      `/api/zipkin/autocomplete/values?key=${encodeURIComponent(key)}`,
    );
  }

  /** List active instances for a service. The per-layer Instance
   *  dashboard surfaces a second selector below the service picker;
   *  this feeds it. Accepts the service id or name. */
  layerInstances(
    layerKey: string,
    service: string,
  ): Promise<{
    layer: string;
    service: string;
    generatedAt: number;
    instances: Array<{
      id: string;
      name: string;
      language: string | null;
      attributes: Array<{ name: string; value: string }>;
    }>;
    reachable: boolean;
    error?: string;
  }> {
    const qs = `?service=${encodeURIComponent(service)}`;
    return this.request(
      'GET',
      `/api/layer/${encodeURIComponent(layerKey)}/instances${qs}`,
    );
  }

  saveLayerTemplate(template: AdminLayerTemplate): Promise<{ template: AdminLayerTemplate }> {
    return this.request<{ template: AdminLayerTemplate }>(
      'POST',
      `/api/admin/layer-templates/${encodeURIComponent(template.key)}`,
      template,
    );
  }

  /** Admin: list every loaded layer template (alias / components / widgets). */
  adminLayerTemplates(): Promise<{ templates: AdminLayerTemplate[] }> {
    return this.request<{ templates: AdminLayerTemplate[] }>(
      'GET',
      '/api/admin/layer-templates',
    );
  }

  // ── trace (agent) profiling ──────────────────────────────────────────
  /** List profile tasks for a service (+ optional endpoint filter). */
  layerProfileTasks(
    layerKey: string,
    service: string,
    endpoint = '',
  ): Promise<ProfileTaskListResponse> {
    const qs = new URLSearchParams({ service });
    if (endpoint) qs.set('endpoint', endpoint);
    return this.request<ProfileTaskListResponse>(
      'GET',
      `/api/layer/${encodeURIComponent(layerKey)}/profile/tasks?${qs.toString()}`,
    );
  }

  /** Create a profile task on the target service / endpoint. */
  createProfileTask(
    layerKey: string,
    body: ProfileTaskCreationRequest,
  ): Promise<ProfileTaskCreationResponse> {
    return this.request<ProfileTaskCreationResponse>(
      'POST',
      `/api/layer/${encodeURIComponent(layerKey)}/profile/tasks`,
      body,
    );
  }

  /** Sampled trace segments captured by a profile task. */
  profileTaskSegments(taskId: string): Promise<ProfileSegmentsResponse> {
    return this.request<ProfileSegmentsResponse>(
      'GET',
      `/api/profile/tasks/${encodeURIComponent(taskId)}/segments`,
    );
  }

  /** Per-instance operation log for a profile task (start / stop events). */
  profileTaskLogs(taskId: string): Promise<ProfileTaskLogsResponse> {
    return this.request<ProfileTaskLogsResponse>(
      'GET',
      `/api/profile/tasks/${encodeURIComponent(taskId)}/logs`,
    );
  }

  /** Resolve profile data for one or more span time-ranges into call trees. */
  profileAnalyze(queries: ProfileAnalyzeQuery[]): Promise<ProfileAnalyzationResponse> {
    return this.request<ProfileAnalyzationResponse>('POST', '/api/profile/analyze', { queries });
  }

  // ── eBPF profiling (ON_CPU / OFF_CPU, fixed-time) ───────────────────
  /** List eBPF profile tasks + the `couldProfiling` / process-label
   *  metadata used by the New Task form. */
  layerEBPFTasks(layerKey: string, service: string): Promise<EBPFTaskListResponse> {
    const qs = new URLSearchParams({ service });
    return this.request<EBPFTaskListResponse>(
      'GET',
      `/api/layer/${encodeURIComponent(layerKey)}/ebpf/tasks?${qs.toString()}`,
    );
  }
  /** Create an eBPF fixed-time task. */
  createEBPFTask(
    layerKey: string,
    body: EBPFTaskCreationRequest,
  ): Promise<EBPFTaskCreationResponse> {
    return this.request<EBPFTaskCreationResponse>(
      'POST',
      `/api/layer/${encodeURIComponent(layerKey)}/ebpf/tasks`,
      body,
    );
  }
  /** Per-task schedules — one entry per (process, time-slice) captured
   *  by the task. */
  ebpfTaskSchedules(taskId: string): Promise<EBPFSchedulesResponse> {
    return this.request<EBPFSchedulesResponse>(
      'GET',
      `/api/ebpf/tasks/${encodeURIComponent(taskId)}/schedules`,
    );
  }
  /** Roll a set of schedules into stack-trees keyed by `aggregateType`
   *  (COUNT / DURATION). */
  ebpfAnalyze(body: EBPFAnalyzeRequest): Promise<EBPFAnalyzeResponse> {
    return this.request<EBPFAnalyzeResponse>('POST', '/api/ebpf/analyze', body);
  }

  // ── eBPF network profiling ───────────────────────────────────────────
  /** List NETWORK / CONTINUOUS_PROFILING eBPF tasks for a service or
   *  service-instance. */
  layerNetworkTasks(
    layerKey: string,
    args: { service?: string; serviceInstance?: string },
  ): Promise<EBPFTaskListResponse> {
    const qs = new URLSearchParams();
    if (args.service) qs.set('service', args.service);
    if (args.serviceInstance) qs.set('serviceInstance', args.serviceInstance);
    return this.request<EBPFTaskListResponse>(
      'GET',
      `/api/layer/${encodeURIComponent(layerKey)}/ebpf/network/tasks?${qs.toString()}`,
    );
  }
  /** Process-level topology centred on a service-instance — the network
   *  profiling view's main visualization. */
  ebpfNetworkTopology(serviceInstance: string, windowMinutes = 30): Promise<ProcessTopologyResponse> {
    const qs = new URLSearchParams({ serviceInstance, windowMinutes: String(windowMinutes) });
    return this.request<ProcessTopologyResponse>('GET', `/api/ebpf/network/topology?${qs.toString()}`);
  }
  /** Create an eBPF network-profile task bound to an instance + sampling
   *  rules (4xx / 5xx / min-duration / URI regex). */
  createNetworkProfilingTask(body: NetworkProfilingCreateRequest): Promise<NetworkProfilingCreateResponse> {
    return this.request<NetworkProfilingCreateResponse>('POST', '/api/ebpf/network/tasks', body);
  }
  /** Heartbeat a continuous-profiling task so OAP keeps capturing. */
  keepAliveNetworkProfilingTask(taskId: string): Promise<NetworkProfilingKeepAliveResponse> {
    return this.request<NetworkProfilingKeepAliveResponse>(
      'POST',
      `/api/ebpf/network/tasks/${encodeURIComponent(taskId)}/keep-alive`,
    );
  }

  // ── Async profiler (Java) ─────────────────────────────────────────
  layerAsyncTasks(layerKey: string, service: string): Promise<AsyncProfilingTaskListResponse> {
    return this.request<AsyncProfilingTaskListResponse>(
      'GET',
      `/api/layer/${encodeURIComponent(layerKey)}/async/tasks?service=${encodeURIComponent(service)}`,
    );
  }
  createAsyncProfilingTask(
    layerKey: string,
    body: AsyncProfilingTaskCreationRequest,
  ): Promise<AsyncProfilingTaskCreationResponse> {
    return this.request<AsyncProfilingTaskCreationResponse>(
      'POST',
      `/api/layer/${encodeURIComponent(layerKey)}/async/tasks`,
      body,
    );
  }
  asyncTaskProgress(taskId: string): Promise<AsyncProfilingProgressResponse> {
    return this.request<AsyncProfilingProgressResponse>(
      'GET',
      `/api/async/tasks/${encodeURIComponent(taskId)}/progress`,
    );
  }
  asyncAnalyze(body: {
    taskId: string;
    instanceIds: string[];
    eventType: string;
  }): Promise<AsyncProfilingAnalyzeResponse> {
    return this.request<AsyncProfilingAnalyzeResponse>('POST', '/api/async/analyze', body);
  }

  // ── pprof (Go) ────────────────────────────────────────────────────
  layerPprofTasks(layerKey: string, service: string): Promise<PprofTaskListResponse> {
    return this.request<PprofTaskListResponse>(
      'GET',
      `/api/layer/${encodeURIComponent(layerKey)}/pprof/tasks?service=${encodeURIComponent(service)}`,
    );
  }
  createPprofTask(
    layerKey: string,
    body: PprofTaskCreationRequest,
  ): Promise<PprofTaskCreationResponse> {
    return this.request<PprofTaskCreationResponse>(
      'POST',
      `/api/layer/${encodeURIComponent(layerKey)}/pprof/tasks`,
      body,
    );
  }
  pprofTaskProgress(taskId: string): Promise<PprofProgressResponse> {
    return this.request<PprofProgressResponse>(
      'GET',
      `/api/pprof/tasks/${encodeURIComponent(taskId)}/progress`,
    );
  }
  pprofAnalyze(body: {
    taskId: string;
    instanceIds: string[];
    eventType: string;
  }): Promise<PprofAnalyzeResponse> {
    return this.request<PprofAnalyzeResponse>('POST', '/api/pprof/analyze', body);
  }

  // ── cluster / preflight ──────────────────────────────────────────────
  preflight(): Promise<unknown> {
    return this.request('GET', '/api/preflight');
  }

  clusterState(): Promise<unknown> {
    return this.request('GET', '/api/cluster/state');
  }
}

export const bffClient = new BffClient();

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
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const shellRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'home',
    component: () => import('@/views/landing/LandingView.vue'),
  },
  // Layer drill-down stubs
  {
    path: 'layer/:layerKey',
    name: 'layer-overview',
    component: () => import('@/views/PlaceholderView.vue'),
    props: (route) => ({
      title: `Layer · ${route.params.layerKey}`,
      phase: 'Phase 2',
      note: 'Layer overview · KPIs, throughput, services table, constellation.',
    }),
  },
  {
    path: 'layer/:layerKey/services',
    component: () => import('@/views/PlaceholderView.vue'),
    props: (route) => ({
      title: `${route.params.layerKey} · Services`,
      phase: 'Phase 2',
    }),
  },
  {
    path: 'layer/:layerKey/instances',
    component: () => import('@/views/PlaceholderView.vue'),
    props: (route) => ({
      title: `${route.params.layerKey} · Instances`,
      phase: 'Phase 3',
    }),
  },
  {
    path: 'layer/:layerKey/endpoints',
    component: () => import('@/views/PlaceholderView.vue'),
    props: (route) => ({
      title: `${route.params.layerKey} · Endpoints`,
      phase: 'Phase 3',
    }),
  },
  {
    path: 'layer/:layerKey/topology',
    component: () => import('@/views/PlaceholderView.vue'),
    props: (route) => ({
      title: `${route.params.layerKey} · Topology`,
      phase: 'Phase 4',
      note: 'Three variants: force-directed, hierarchical DAG, hex/honeycomb.',
    }),
  },

  // Telemetry
  { path: 'dashboards', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Dashboards', phase: 'Phase 3', note: 'Widget grid, per-scope templates, MQE editor.' } },
  { path: 'operate/traces', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Trace explorer', phase: 'Phase 5', note: 'Native (v2/v1) + Zipkin Lens, switchable.' } },
  { path: 'operate/traces/:traceId', component: () => import('@/views/PlaceholderView.vue'), props: (r) => ({ title: `Trace · ${r.params.traceId}`, phase: 'Phase 5' }) },
  { path: 'operate/logs', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Log explorer', phase: 'Phase 5' } },
  { path: 'profiling', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Profiling', phase: 'Phase 8', note: 'Sampled · async-profiler · eBPF · Go pprof — unified flame graph.' } },
  { path: 'operate/events', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Events', phase: 'Phase 5' } },

  // Operate
  { path: 'operate/alarms', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Alarms', phase: 'Phase 5', note: 'Read-only; recovery is backend-auto. Live debug card via admin REST.' } },

  // Admin
  { path: 'cluster', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Cluster status', phase: 'Phase 6 / 7', note: 'Module activity matrix · storage health · receiver activity · effective config tree · TTL grid.' } },
  { path: 'admin/users', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Users', phase: 'Phase 7' } },
  { path: 'admin/roles', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Roles & permissions', phase: 'Phase 7' } },
  { path: 'admin/audit', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Audit log', phase: 'Phase 7' } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/components/shell/AppShell.vue'),
      children: shellRoutes,
    },
    {
      path: '/:catchAll(.*)*',
      component: () => import('@/views/PlaceholderView.vue'),
      props: { title: 'Not found', phase: 'never', note: 'No route matches.' },
    },
  ],
});

let bootstrapped = false;

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!bootstrapped) {
    await auth.bootstrap();
    bootstrapped = true;
  }
  const isPublic = to.meta.public === true;
  if (!isPublic && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { path: '/' };
  }
});

export default router;

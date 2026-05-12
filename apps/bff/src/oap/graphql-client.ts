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

import type { FetchLike } from '@skywalking-horizon-ui/api-client';

export interface GraphqlOptions {
  statusUrl: string;
  timeoutMs: number;
  fetch?: FetchLike;
}

export class GraphqlError extends Error {
  readonly statusCode: number;
  readonly errors?: ReadonlyArray<{ message: string; path?: ReadonlyArray<string | number> }>;
  constructor(
    statusCode: number,
    message: string,
    errors?: ReadonlyArray<{ message: string; path?: ReadonlyArray<string | number> }>,
  ) {
    super(message);
    this.name = 'GraphqlError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * POST a GraphQL query to OAP's `/graphql` endpoint and return the unwrapped
 * `data` field. Throws on transport errors and on GraphQL-level error arrays.
 */
export async function graphqlPost<T>(
  opts: GraphqlOptions,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const f = opts.fetch ?? globalThis.fetch.bind(globalThis);
  const url = opts.statusUrl.replace(/\/$/, '') + '/graphql';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  let res: Response;
  try {
    res = await f(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables: variables ?? {} }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new GraphqlError(res.status, `graphql http ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as { data?: T; errors?: ReadonlyArray<{ message: string; path?: ReadonlyArray<string | number> }> };
  if (body.errors && body.errors.length) {
    throw new GraphqlError(200, body.errors.map((e) => e.message).join('; '), body.errors);
  }
  if (body.data === undefined || body.data === null) {
    throw new GraphqlError(200, 'graphql response had no data field');
  }
  return body.data;
}

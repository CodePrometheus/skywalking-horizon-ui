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

import pino, { type LoggerOptions } from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Default log level:
 *   - dev: `debug` (verbose, helpful while iterating)
 *   - prod: `error` (quiet by default — Fastify's per-request `info`
 *     access logs are suppressed; only warnings, errors, and fatals
 *     reach stdout)
 *
 * Operators turn it up explicitly when triaging: `LOG_LEVEL=info` for
 * access logs, `LOG_LEVEL=debug` for the lifecycle chatter, `trace`
 * for everything pino-instrumented code emits.
 */
export const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'error'),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
};

export const logger = pino(loggerOptions);

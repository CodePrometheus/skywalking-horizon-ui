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

import { describe, it, expect } from 'vitest';
import {
  parseServiceName,
  serviceBaseName,
  serviceGroupName,
  resolveServiceIdentity,
} from './serviceName';

describe('parseServiceName', () => {
  it('returns null group + raw base for nullish input', () => {
    expect(parseServiceName(null)).toEqual({ group: null, base: '', raw: '' });
    expect(parseServiceName(undefined)).toEqual({ group: null, base: '', raw: '' });
    expect(parseServiceName('')).toEqual({ group: null, base: '', raw: '' });
  });

  it('returns null group for plain names without `::`', () => {
    expect(parseServiceName('frontend')).toEqual({
      group: null,
      base: 'frontend',
      raw: 'frontend',
    });
  });

  it('splits `<group>::<base>` correctly', () => {
    expect(parseServiceName('agent::checkout')).toEqual({
      group: 'agent',
      base: 'checkout',
      raw: 'agent::checkout',
    });
  });

  it('preserves dots in the base segment', () => {
    expect(parseServiceName('mesh-svr::reviews.default')).toEqual({
      group: 'mesh-svr',
      base: 'reviews.default',
      raw: 'mesh-svr::reviews.default',
    });
  });

  it('treats a leading `::` as no group (idx === 0 fails the > 0 guard)', () => {
    expect(parseServiceName('::orphan')).toEqual({
      group: null,
      base: '::orphan',
      raw: '::orphan',
    });
  });

  it('keeps trailing `::` as raw (no base)', () => {
    expect(parseServiceName('foo::')).toEqual({
      group: 'foo',
      base: '',
      raw: 'foo::',
    });
  });

  it('only splits on the first `::` — second `::` stays in base', () => {
    expect(parseServiceName('a::b::c')).toEqual({
      group: 'a',
      base: 'b::c',
      raw: 'a::b::c',
    });
  });
});

describe('serviceBaseName / serviceGroupName convenience helpers', () => {
  it('serviceBaseName returns the stripped name', () => {
    expect(serviceBaseName('mesh-svr::reviews')).toBe('reviews');
    expect(serviceBaseName('frontend')).toBe('frontend');
    expect(serviceBaseName(null)).toBe('');
  });

  it('serviceGroupName returns the group (or null)', () => {
    expect(serviceGroupName('mesh-svr::reviews')).toBe('mesh-svr');
    expect(serviceGroupName('frontend')).toBeNull();
    expect(serviceGroupName(null)).toBeNull();
  });
});

describe('resolveServiceIdentity', () => {
  it('legacy `::` group is stripped to base when no cluster rule', () => {
    const r = resolveServiceIdentity('agent::checkout', null);
    expect(r).toEqual({
      display: 'checkout',
      cluster: null,
      clusterAlias: null,
      legacyGroup: 'agent',
    });
  });

  it('plain name passes through with no group / cluster', () => {
    const r = resolveServiceIdentity('frontend', null);
    expect(r).toEqual({
      display: 'frontend',
      cluster: null,
      clusterAlias: null,
      legacyGroup: null,
    });
  });

  it('applies a `<service>.<namespace>` cluster rule', () => {
    const rule = {
      pattern: '^(?<service>[^.]+)\\.(?<namespace>[^.]+)(?:\\..*)?$',
      displayGroup: 'service',
      valueGroup: 'namespace',
      alias: 'namespace',
    };
    expect(resolveServiceIdentity('reviews.default', rule)).toEqual({
      display: 'reviews',
      cluster: 'default',
      clusterAlias: 'namespace',
      legacyGroup: null,
    });
  });

  it('stacks legacy + cluster rule — strips `mesh-svr::` from captured service', () => {
    const rule = {
      pattern: '^(?<service>[^.]+)\\.(?<namespace>[^.]+)(?:\\..*)?$',
      displayGroup: 'service',
      valueGroup: 'namespace',
      alias: 'namespace',
    };
    expect(resolveServiceIdentity('mesh-svr::reviews.default', rule)).toEqual({
      display: 'reviews',
      cluster: 'default',
      clusterAlias: 'namespace',
      legacyGroup: 'mesh-svr',
    });
  });

  it('partial cluster match (display only, no value) preserves display + legacy group', () => {
    const rule = {
      pattern: '^(?<service>[^.]+)$',
      displayGroup: 'service',
      valueGroup: 'group',
      alias: 'group',
    };
    expect(resolveServiceIdentity('mesh-svr::reviews', rule)).toEqual({
      display: 'reviews',
      cluster: null,
      clusterAlias: null,
      legacyGroup: 'mesh-svr',
    });
  });

  it('falls back to legacy parser when the cluster regex does not match', () => {
    const rule = {
      pattern: '^impossible-\\d+$',
      displayGroup: 'service',
      valueGroup: 'group',
      alias: 'group',
    };
    expect(resolveServiceIdentity('agent::checkout', rule)).toEqual({
      display: 'checkout',
      cluster: null,
      clusterAlias: null,
      legacyGroup: 'agent',
    });
  });

  it('invalid regex in the cluster rule is swallowed (treated as no rule)', () => {
    const rule = {
      pattern: '[invalid(regex',
      displayGroup: 'service',
      valueGroup: 'group',
      alias: 'group',
    };
    expect(resolveServiceIdentity('frontend', rule)).toEqual({
      display: 'frontend',
      cluster: null,
      clusterAlias: null,
      legacyGroup: null,
    });
  });

  it('default capture-group names (service / group) work when omitted', () => {
    const rule = {
      pattern: '^(?<service>[^.]+)\\.(?<group>[^.]+)$',
      alias: 'namespace',
    };
    expect(resolveServiceIdentity('reviews.default', rule)).toEqual({
      display: 'reviews',
      cluster: 'default',
      clusterAlias: 'namespace',
      legacyGroup: null,
    });
  });
});

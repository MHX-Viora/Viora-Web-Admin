import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const React = require('react');
const CopyValue = () => null;

function render(data) {
  const module = { exports: {} };
  const source = require('typescript').transpileModule(readFileSync(new URL('../src/features/developer/OpenApiIntegrationPanel.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: 1, jsx: 4, target: 9 },
  }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require(name) {
    if (name === 'react') return { ...React, useState: value => [value, () => {}] };
    if (name === '@tanstack/react-query') return {
      useQueryClient: () => ({}), useQuery: () => ({ data }), useMutation: () => ({}),
    };
    if (name === './Shared') return { CopyValue };
    if (name === '../../components/common') return { ConfirmDialog: () => null };
    if (name === '../../services/open-api.service') return {};
    if (name === '../../services/http') return { getErrorMessage: String };
    if (name === 'sonner') return { toast: {} };
    return require(name);
  } });
  return module.exports.OpenApiIntegrationPanel({ appId: 'app' });
}

function nodes(tree) {
  return tree && typeof tree === 'object'
    ? [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)] : [];
}

const integration = {
  enabled: true, issuer: 'https://identity.example/tenant/', clientId: 'ankt_public_client',
  discoveryUrl: 'https://identity.example/tenant/.well-known/openid-configuration',
  authorizationEndpoint: 'https://identity.example/custom/authorize',
  tokenEndpoint: 'https://identity.example/custom/token',
  jwksEndpoint: 'https://identity.example/custom/jwks',
  approvedScopes: ['openid'], approvedCallbackUrls: ['https://partner.example/callback'],
  usage: { requests: 0, successful: 0, unauthorized: 0, forbidden: 0, rateLimited: 0 },
};

test('SSO offers copy controls for exact backend endpoints and approved callbacks', () => {
  const copies = nodes(render(integration)).filter(node => node.type === CopyValue).map(node => node.props.value);
  for (const value of [integration.clientId, integration.issuer, integration.discoveryUrl,
    integration.authorizationEndpoint, integration.tokenEndpoint, integration.jwksEndpoint,
    ...integration.approvedCallbackUrls]) assert.ok(copies.includes(value), `Missing copy control: ${value}`);
});

test('older backends do not generate guessed OAuth endpoints', () => {
  const copies = nodes(render({ ...integration, authorizationEndpoint: undefined, tokenEndpoint: undefined, jwksEndpoint: undefined }))
    .filter(node => node.type === CopyValue).map(node => node.props.value);
  assert.ok(copies.includes(''));
  assert.equal(copies.some(value => value?.includes('/oauth/')), false);
});

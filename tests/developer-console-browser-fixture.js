// Local browser regression fixture only; no request can reach an ANKT API.
(() => {
  if (location.hostname !== '127.0.0.1' || location.port !== '4187') return;
  const accountId = '00000000-0000-0000-0000-000000000002';
  const appId = '00000000-0000-0000-0000-000000000003';
  const profile = { id: '00000000-0000-0000-0000-000000000001', accountId, name: 'Developer kiểm thử', email: 'fixture@example.com', status: 'Active', registrationStatus: 'Approved', membershipRole: 'Owner', phone: '0901234567', country: 'VN', partnerType: 'Individual', registrationVersion: 1, termsAcceptedVersion: 'fixture-terms-1' };
  const app = { id: appId, developerId: profile.id, name: 'Ứng dụng kiểm thử', slug: 'fixture-app', category: 'Tiện ích', description: 'Dữ liệu kiểm thử giao diện local; không phải ứng dụng production.', webUrl: 'https://fixture.example', allowedDomains: ['fixture.example'], callbackUrl: 'https://fixture.example/auth/callback', callbackUrls: ['https://fixture.example/auth/callback'], allowedOrigins: ['https://fixture.example'], permissions: [{ code: 'identity.login', name: 'Đăng nhập', isSensitive: false }], clientId: 'ankt_fixture_public_client', clientAuthenticationMethod: 'ClientSecretPost', authenticationMode: 'AnktSso', status: 'Draft', reviewState: 'Draft', publicationStatus: 'Unpublished', membershipRole: 'Owner', createdAt: '2026-10-13T01:00:00Z', updatedAt: '2026-10-13T01:00:00Z', publishedVersion: 0 };
  const token = `fixture.${btoa(JSON.stringify({ sub: accountId, exp: 4102444800 }))}.invalid`;
  sessionStorage.setItem('ankt_developer_session', JSON.stringify({ token, accountId, displayName: profile.name }));
  const fixture = window.__developerConsoleFixture = { requests: [], app, profile };
  const NativeXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = class extends NativeXHR {
    open(method, url, ...rest) { this.method = method; this.url = String(url); this.mocked = this.url.includes('/api/'); if (!this.mocked) super.open(method, url, ...rest); }
    setRequestHeader(...args) { if (!this.mocked) super.setRequestHeader(...args); }
    getAllResponseHeaders() { return this.mocked ? 'content-type: application/json' : super.getAllResponseHeaders(); }
    send(body) {
      if (!this.mocked) return super.send(body);
      const path = new URL(this.url, location.href).pathname; fixture.requests.push({ method: this.method, path, body: body ? JSON.parse(body) : null });
      let data = [];
      if (path.endsWith('/profile')) data = profile;
      else if (path.endsWith('/organizations')) data = [{ id: profile.id, name: profile.name, role: 'Owner', status: 'Active', isAccountOwner: true }];
      else if (path.endsWith('/credentials')) data = { clientId: app.clientId, clientAuthenticationMethod: app.clientAuthenticationMethod, hasSecret: true, canRotate: true };
      else if (path.endsWith('/domains')) data = [{ id: 'domain', host: 'fixture.example', challengeToken: 'fixture-token', verificationFileName: 'ankt-verify-0123456789abcdef0123456789abcdef.txt', verificationUrl: 'https://fixture.example/ankt-verify-0123456789abcdef0123456789abcdef.txt', fileContent: 'ankt-domain-verification=fixture-token', expiresAt: '2099-10-13T01:00:00Z' }];
      else if (path.endsWith('/members')) data = [{ id: 'member', accountId, role: 'Owner', createdAt: '2026-10-13T01:00:00Z' }];
      else if (path.endsWith('/terms')) data = { version: 'fixture-terms-1', documents: [{ id: 'developer', title: 'Điều khoản kiểm thử', content: 'Nội dung local.' }] };
      else if (path.endsWith('/analytics')) data = { successfulLaunches: 3, failedLaunches: 1, uniqueUsers: 2, daily: [{ date: '2026-10-13', launches: 4, failures: 1 }] };
      else if (path.endsWith('/audit')) data = { items: [], total: 0, page: 1, pageSize: 20 };
      else if (path.endsWith('/technical-test')) data = null;
      else if (path.endsWith(`/mini-apps/${appId}`)) data = app;
      else if (path.endsWith('/mini-apps')) data = [app];
      for (const [key, value] of Object.entries({ status: 200, statusText: 'OK', readyState: 4, responseText: JSON.stringify(data), response: JSON.stringify(data), responseURL: this.url })) Object.defineProperty(this, key, { configurable: true, value });
      setTimeout(() => this.onloadend?.(new ProgressEvent('loadend')), 5);
    }
  };
})();

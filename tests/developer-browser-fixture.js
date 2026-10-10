// DevTools initScript for local preview only. All API calls are intercepted;
// the synthetic bearer value cannot authenticate against an ANKT server.
(() => {
  if (location.hostname !== '127.0.0.1' || location.port !== '4187') return;
  const initial = new URL(location.href).searchParams.get('scenario');
  const profile = { id: '00000000-0000-0000-0000-000000000001', accountId: '00000000-0000-0000-0000-000000000002', name: 'Demo Developer', email: 'demo@example.com', status: initial || 'Pending', membershipRole: 'Owner' };
  const fixture = window.__developerFixture = { profile: initial ? profile : null, requests: [] };
  const token = `fixture.${btoa(JSON.stringify({ sub: profile.accountId, exp: 4102444800 }))}.invalid`;
  sessionStorage.setItem('ankt_developer_session', JSON.stringify({ token, accountId: profile.accountId, displayName: 'Local fixture' }));
  const NativeXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = class extends NativeXHR {
    open(method, url, ...args) {
      this.fixtureMethod = method; this.fixtureUrl = String(url);
      this.mocked = this.fixtureUrl.includes('/api/');
      if (!this.mocked) super.open(method, url, ...args);
    }
    setRequestHeader(...args) { if (!this.mocked) super.setRequestHeader(...args); }
    getAllResponseHeaders() { return this.mocked ? 'content-type: application/json' : super.getAllResponseHeaders(); }
    send(body) {
      if (!this.mocked) return super.send(body);
      let status = 200, data = [];
      fixture.requests.push({ method: this.fixtureMethod, path: new URL(this.fixtureUrl, location.href).pathname, body: body ? JSON.parse(body) : null });
      if (this.fixtureUrl.includes('/api/developer/profile')) {
        if (this.fixtureMethod === 'POST' || this.fixtureMethod === 'PUT') fixture.profile = { ...profile, ...JSON.parse(body), status: 'Pending' };
        data = fixture.profile;
        if (!data) status = 404;
      }
      for (const [key, value] of Object.entries({ status, statusText: status === 200 ? 'OK' : 'Not Found', readyState: 4, responseText: JSON.stringify(data), response: JSON.stringify(data), responseURL: this.fixtureUrl })) Object.defineProperty(this, key, { configurable: true, value });
      setTimeout(() => this.onloadend?.(new ProgressEvent('loadend')), 15);
    }
  };
})();

export default { routes: [
  { method: 'GET', path: '/combo-offer', handler: 'combo-offer.current', config: { auth: false } },
  { method: 'PUT', path: '/combo-offer', handler: 'combo-offer.save', config: { policies: ['global::is-authenticated', { name: 'global::has-role', config: { roles: ['content_manager'] } }] } },
] };

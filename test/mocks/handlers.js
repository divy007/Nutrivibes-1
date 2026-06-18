const { http, HttpResponse } = require('msw');
const { seedPlan } = require('../fixtures/seedPlan');

const handlers = [
  // Mock login – returns a static token and role based on email
  http.post('/api/auth/login', async ({ request }) => {
    const { email } = await request.json();
    const role = email.includes('dietician') ? 'dietician' : 'client';
    return HttpResponse.json({ token: 'fake-jwt-token', role }, { status: 200 });
  }),

  // Mock fetching the client’s diet plan – deterministic fixture
  http.get('/api/client/me/diet-plan', () => {
    return HttpResponse.json(seedPlan, { status: 200 });
  }),

  // Mock pause action – simple success message
  http.post('/api/clients/:id/pause', () => {
    return HttpResponse.json({ message: 'Plan paused' }, { status: 200 });
  }),

  // Mock resume action – simple success message
  http.post('/api/clients/:id/resume', () => {
    return HttpResponse.json({ message: 'Plan resumed' }, { status: 200 });
  })
];

module.exports = { handlers };

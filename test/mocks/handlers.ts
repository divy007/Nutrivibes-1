// test/mocks/handlers.ts
import { rest } from 'msw';
import { seedPlan } from '../fixtures/seedPlan';

export const handlers = [
  // Mock login – returns a static token and role based on email
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email } = req.body as { email: string };
    const role = email.includes('dietician') ? 'dietician' : 'client';
    return res(
      ctx.status(200),
      ctx.json({ token: 'fake-jwt-token', role })
    );
  }),

  // Mock fetching the client’s diet plan – deterministic fixture
  rest.get('/api/client/me/diet-plan', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(seedPlan));
  }),

  // Mock pause and resume actions – simple success messages
  rest.post('/api/clients/:id/pause', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Plan paused' }));
  }),

  rest.post('/api/clients/:id/resume', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Plan resumed' }));
  }),
];

/**
 * @jest-environment node
 */

import { GET } from '@/app/api/clients/[id]/diet-plan/route';
import { getAuthUser } from '@/lib/auth';
import DietPlan from '@/models/DietPlan';
import Client from '@/models/Client';

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue({}),
}));

const mockPlanObj = {
  _id: 'plan123',
  clientId: 'client123',
  weekStartDate: new Date('2026-08-03T00:00:00.000Z'),
  days: [
    {
      date: new Date('2026-08-03T00:00:00.000Z'),
      status: 'PUBLISHED',
      meals: [{ mealNumber: 1, time: '07:00', foodItems: [{ name: 'Oats' }] }],
    },
    {
      date: new Date('2026-08-04T00:00:00.000Z'),
      status: 'NOT_SAVED',
      meals: [{ mealNumber: 1, time: '07:00', foodItems: [{ name: 'Fruit' }] }],
    },
  ],
  toObject: function () {
    return {
      _id: this._id,
      clientId: this.clientId,
      weekStartDate: this.weekStartDate,
      days: JSON.parse(JSON.stringify(this.days)),
    };
  },
};

jest.mock('@/models/DietPlan', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockImplementation(() => mockPlanObj),
  },
}));

jest.mock('@/models/Client', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockResolvedValue({
      _id: 'client123',
      name: 'Jane Client',
      userId: 'user123',
    }),
  },
}));

describe('GET /api/clients/[id]/diet-plan with previewMode=client', () => {
  const mockDieticianUser = {
    _id: 'dietician123',
    role: 'DIETICIAN',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthUser as jest.Mock).mockResolvedValue(mockDieticianUser);
  });

  it('should return full diet plan when previewMode is NOT passed', async () => {
    const req = new Request('http://localhost/api/clients/client123/diet-plan?startDate=2026-08-03');
    const params = Promise.resolve({ id: 'client123' });
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.days[1].status).toBe('NOT_SAVED');
    expect(data.days[1].meals.length).toBe(1);
  });

  it('should filter unpublished meals and set status to NO_DIET when previewMode=client is passed', async () => {
    const req = new Request('http://localhost/api/clients/client123/diet-plan?startDate=2026-08-03&previewMode=client');
    const params = Promise.resolve({ id: 'client123' });
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Published day remains intact
    expect(data.days[0].status).toBe('PUBLISHED');
    expect(data.days[0].meals.length).toBe(1);

    // Unpublished day gets stripped of meals and status converted to NO_DIET (matching client API)
    expect(data.days[1].status).toBe('NO_DIET');
    expect(data.days[1].meals.length).toBe(0);
  });
});

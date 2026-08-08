/**
 * @jest-environment node
 */

import { GET } from '@/app/api/client/diet-plan/route';
import { verifyToken } from '@/lib/auth';
import DietPlan from '@/models/DietPlan';
import Client from '@/models/Client';

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue({}),
}));

const mockClientUser = {
  userId: 'clientUser123',
  role: 'CLIENT',
};

const mockClientDoc = {
  _id: 'client123',
  userId: 'clientUser123',
  name: 'John Doe',
};

const mockDietPlanDoc = {
  _id: 'plan123',
  clientId: 'client123',
  weekStartDate: new Date('2026-08-03T00:00:00.000Z'),
  lastViewedByClientAt: null as Date | null,
  days: [
    {
      date: new Date('2026-08-03T00:00:00.000Z'),
      status: 'PUBLISHED',
      meals: [{ mealNumber: 1, time: '07:00', foodItems: [{ name: 'Oats' }] }],
    },
  ],
  toObject: function () {
    return {
      _id: this._id,
      clientId: this.clientId,
      weekStartDate: this.weekStartDate,
      lastViewedByClientAt: this.lastViewedByClientAt,
      days: JSON.parse(JSON.stringify(this.days)),
    };
  },
};

jest.mock('@/models/Client', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockImplementation(() => mockClientDoc),
  },
}));

jest.mock('@/models/DietPlan', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockImplementation(() => mockDietPlanDoc),
    findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
      if (update.lastViewedByClientAt) {
        mockDietPlanDoc.lastViewedByClientAt = update.lastViewedByClientAt;
      }
      return Promise.resolve(mockDietPlanDoc);
    }),
  },
}));

describe('Read Receipts: GET /api/client/diet-plan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockReturnValue(mockClientUser);
  });

  it('should update lastViewedByClientAt timestamp when client views published diet plan', async () => {
    const req = new Request('http://localhost/api/client/diet-plan?startDate=2026-08-03', {
      headers: {
        Authorization: 'Bearer valid_token',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Verify findByIdAndUpdate was called to update read receipt timestamp
    expect(DietPlan.findByIdAndUpdate).toHaveBeenCalledWith('plan123', expect.objectContaining({
      lastViewedByClientAt: expect.any(Date),
    }));

    // Verify response contains updated lastViewedByClientAt
    expect(data.lastViewedByClientAt).toBeDefined();
  });
});

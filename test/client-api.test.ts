/**
 * @jest-environment node
 */

import { POST } from '@/app/api/clients/route';
import { PATCH } from '@/app/api/clients/[id]/route';
import Client from '@/models/Client';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import Plan from '@/models/Plan';
import { getAuthUser } from '@/lib/auth';
import { generateFollowUps } from '@/lib/follow-up-utils';

jest.mock('@/lib/auth', () => ({
    getAuthUser: jest.fn()
}));

jest.mock('@/lib/mongodb', () => ({
    connectDB: jest.fn().mockResolvedValue({})
}));

jest.mock('@/lib/follow-up-utils', () => ({
    generateFollowUps: jest.fn().mockResolvedValue({})
}));

jest.mock('@/models/Client', () => {
    const mockClient = {
        _id: 'client123',
        name: 'Jane Doe',
        dieticianId: 'dietician456',
        createdAt: new Date('2026-06-18T00:00:00.000Z')
    };
    return {
        __esModule: true,
        default: {
            create: jest.fn().mockResolvedValue(mockClient),
            findById: jest.fn().mockImplementation((id) => ({
                _id: id,
                createdAt: new Date('2026-06-18T00:00:00.000Z'),
                dieticianId: 'dietician456',
                pendingReferralDays: 0,
                status: 'NEW',
                save: jest.fn().mockResolvedValue({})
            })),
            findByIdAndUpdate: jest.fn().mockResolvedValue(mockClient)
        }
    };
});

jest.mock('@/models/User', () => {
    return {
        __esModule: true,
        default: {
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ _id: 'user123' })
        }
    };
});

jest.mock('@/models/Subscription', () => {
    const mockSub = {
        _id: 'sub123',
        planId: 'plan123',
        status: 'ASSIGNED',
        save: jest.fn().mockResolvedValue({})
    };
    const mockFindOne = {
        sort: jest.fn().mockResolvedValue(mockSub)
    };
    return {
        __esModule: true,
        default: {
            findOne: jest.fn().mockReturnValue(mockFindOne)
        }
    };
});

jest.mock('@/models/Plan', () => {
    return {
        __esModule: true,
        default: {
            findById: jest.fn().mockResolvedValue({
                _id: 'plan123',
                name: 'Standard Plan',
                durationMonths: 1,
                price: 100
            })
        }
    };
});

describe('Client API Routes', () => {
    const mockDietician = {
        _id: 'dietician456',
        role: 'DIETICIAN'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getAuthUser as jest.Mock).mockResolvedValue(mockDietician);
    });

    describe('POST /api/clients', () => {
        it('should return 400 if dietStartDate is more than 365 days in the past', async () => {
            const pastDate = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const req = new Request('http://localhost/api/clients', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    phone: '1234567890',
                    password: 'Password123',
                    dietStartDate: pastDate
                })
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('Diet start date cannot be more than 365 days in the past');
        });

        it('should allow dietStartDate to be in the past up to 365 days', async () => {
            const pastDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60 days in past
            const req = new Request('http://localhost/api/clients', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    phone: '1234567890',
                    password: 'Password123',
                    dietStartDate: pastDate
                })
            });

            const res = await POST(req);
            expect(res.status).toBe(201);
            expect(Client.create).toHaveBeenCalled();
            expect(generateFollowUps).toHaveBeenCalledWith('client123', 'dietician456', expect.any(Date));
        });

        it('should return 400 if dietStartDate is more than 60 days in the future', async () => {
            const farFutureDate = new Date(Date.now() + 61 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const req = new Request('http://localhost/api/clients', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    phone: '1234567890',
                    password: 'Password123',
                    dietStartDate: farFutureDate
                })
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('Diet start date cannot be more than 60 days in the future');
        });
    });

    describe('PATCH /api/clients/[id]', () => {
        it('should return 400 if dietStartDate is more than 365 days in the past', async () => {
            const pastDate = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const req = new Request('http://localhost/api/clients/69ae3fca09498bdf8fdf9d45', {
                method: 'PATCH',
                body: JSON.stringify({
                    dietStartDate: pastDate
                })
            });

            const params = Promise.resolve({ id: '69ae3fca09498bdf8fdf9d45' });
            const res = await PATCH(req, { params });
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('Diet start date cannot be more than 365 days in the past');
        });

        it('should allow dietStartDate in the past up to 365 days (e.g. 60 days ago)', async () => {
            const pastDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60 days ago
            const req = new Request('http://localhost/api/clients/69ae3fca09498bdf8fdf9d45', {
                method: 'PATCH',
                body: JSON.stringify({
                    dietStartDate: pastDate
                })
            });

            const params = Promise.resolve({ id: '69ae3fca09498bdf8fdf9d45' });
            const res = await PATCH(req, { params });
            expect(res.status).toBe(200);
            expect(Client.findByIdAndUpdate).toHaveBeenCalled();
            expect(generateFollowUps).toHaveBeenCalledWith('client123', 'dietician456', expect.any(Date));
        });

        it('should return 400 if dietStartDate is more than 60 days in the future', async () => {
            const farFutureDate = new Date(Date.now() + 61 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const req = new Request('http://localhost/api/clients/69ae3fca09498bdf8fdf9d45', {
                method: 'PATCH',
                body: JSON.stringify({
                    dietStartDate: farFutureDate
                })
            });

            const params = Promise.resolve({ id: '69ae3fca09498bdf8fdf9d45' });
            const res = await PATCH(req, { params });
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('Diet start date cannot be more than 60 days in the future');
        });
    });
});

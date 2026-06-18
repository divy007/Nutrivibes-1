import { generateFollowUps } from '@/lib/follow-up-utils';
import FollowUp from '@/models/FollowUp';

jest.mock('@/models/FollowUp', () => {
    return {
        __esModule: true,
        default: {
            deleteMany: jest.fn().mockResolvedValue({}),
            insertMany: jest.fn().mockResolvedValue([])
        }
    };
});

describe('follow-up-utils', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateFollowUps', () => {
        it('should delete existing pending Diet followups and schedule 4 check-ins', async () => {
            const clientId = 'client123';
            const dieticianId = 'dietician456';
            const dietStartDate = new Date('2026-06-18T00:00:00.000Z');

            await generateFollowUps(clientId, dieticianId, dietStartDate);

            // 1. Verify deleteMany called with correct filters
            expect(FollowUp.deleteMany).toHaveBeenCalledWith({
                clientId,
                status: 'Pending',
                category: 'Diet'
            });

            // 2. Verify insertMany called with exactly 4 entries at days 7, 14, 21, and 28
            expect(FollowUp.insertMany).toHaveBeenCalledTimes(1);
            const createdFollowUps = (FollowUp.insertMany as jest.Mock).mock.calls[0][0];
            expect(createdFollowUps.length).toBe(4);

            const intervals = [7, 14, 21, 28];
            intervals.forEach((days, index) => {
                const item = createdFollowUps[index];
                expect(item.clientId).toBe(clientId);
                expect(item.dieticianId).toBe(dieticianId);
                expect(item.category).toBe('Diet');
                expect(item.status).toBe('Pending');
                expect(item.timing).toBe('09:00 AM');
                
                const expectedDate = new Date(dietStartDate);
                expectedDate.setDate(expectedDate.getDate() + days);
                expectedDate.setUTCHours(9, 0, 0, 0);
                expect(new Date(item.date).toISOString()).toBe(expectedDate.toISOString());
            });
        });
    });
});

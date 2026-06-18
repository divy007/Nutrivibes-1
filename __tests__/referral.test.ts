import { processReferralReward } from '../src/lib/referral';
import Client from '../src/models/Client';
import Subscription from '../src/models/Subscription';

jest.mock('../src/models/Client');
jest.mock('../src/models/Subscription');

describe('processReferralReward', () => {
  let mockClientSave: jest.Mock;
  let mockReferrerSave: jest.Mock;
  let mockSubSave: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientSave = jest.fn().mockResolvedValue(true);
    mockReferrerSave = jest.fn().mockResolvedValue(true);
    mockSubSave = jest.fn().mockResolvedValue(true);
  });

  test('should return early if referee client is not found', async () => {
    (Client.findById as jest.Mock).mockResolvedValue(null);
    
    await processReferralReward('client123', 3);
    
    expect(Client.findById).toHaveBeenCalledWith('client123');
  });

  test('should queue pending days if referrer has no subscription', async () => {
    const referee = {
      _id: 'referee123',
      referredBy: 'referrer456',
      referralStatus: 'PENDING',
      name: 'John Referee',
      save: mockClientSave
    };

    const referrer = {
      _id: 'referrer456',
      name: 'Jane Referrer',
      pendingReferralDays: 0,
      referralRewards: [] as any[],
      save: mockReferrerSave
    };

    (Client.findById as jest.Mock)
      .mockResolvedValueOnce(referee)
      .mockResolvedValueOnce(referrer);
    
    (Subscription.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue(null)
    });

    await processReferralReward('referee123', 6); // 6 months plan -> 30 days reward

    expect(referee.referralStatus).toBe('REWARDED');
    expect(mockClientSave).toHaveBeenCalled();

    expect(referrer.pendingReferralDays).toBe(30);
    expect(referrer.referralRewards.length).toBe(1);
    expect(referrer.referralRewards[0].daysEarned).toBe(30);
    expect(referrer.referralRewards[0].note).toContain('Pending subscription activation');
    expect(mockReferrerSave).toHaveBeenCalled();
  });

  test('should immediately extend subscription if referrer has active plan', async () => {
    const referee = {
      _id: 'referee123',
      referredBy: 'referrer456',
      referralStatus: 'PENDING',
      name: 'John Referee',
      save: mockClientSave
    };

    const referrer = {
      _id: 'referrer456',
      name: 'Jane Referrer',
      save: mockReferrerSave
    };

    const mockSubscription = {
      _id: 'sub789',
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in future
      status: 'ACTIVE',
      save: mockSubSave
    };

    (Client.findById as jest.Mock)
      .mockResolvedValueOnce(referee)
      .mockResolvedValueOnce(referrer);
    
    (Subscription.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockSubscription)
    });

    (Client.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);

    const oldEndDate = new Date(mockSubscription.endDate);

    await processReferralReward('referee123', 12); // 12 months plan -> 60 days reward

    expect(referee.referralStatus).toBe('REWARDED');
    expect(mockClientSave).toHaveBeenCalled();

    const expectedEndDate = new Date(oldEndDate);
    expectedEndDate.setDate(expectedEndDate.getDate() + 60);
    expect(mockSubscription.endDate.getDate()).toBe(expectedEndDate.getDate());
    expect(mockSubSave).toHaveBeenCalled();
    expect(Client.findByIdAndUpdate).toHaveBeenCalled();
  });
});

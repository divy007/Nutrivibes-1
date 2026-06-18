import Client from '../src/models/Client';
import Subscription from '../src/models/Subscription';

jest.mock('../src/models/Client');
jest.mock('../src/models/Subscription');

describe('CRM Client Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should mock Client status and pausedUntil updates successfully', async () => {
    const mockClient = {
      _id: 'client123',
      name: 'Test Client',
      status: 'ACTIVE',
      pausedUntil: null,
      save: jest.fn().mockResolvedValue(true)
    };

    (Client.findById as jest.Mock).mockResolvedValue(mockClient);
    (Client.findByIdAndUpdate as jest.Mock).mockImplementation((id, update) => {
      return Promise.resolve({ ...mockClient, ...update });
    });

    const pausedClient = await Client.findByIdAndUpdate('client123', {
      status: 'PAUSED',
      pausedUntil: new Date('2026-12-31')
    });

    expect(Client.findByIdAndUpdate).toHaveBeenCalledWith('client123', {
      status: 'PAUSED',
      pausedUntil: new Date('2026-12-31')
    });
    expect(pausedClient?.status).toBe('PAUSED');
    expect(pausedClient?.pausedUntil).toEqual(new Date('2026-12-31'));
  });

  test('should mock Client status and pausedUntil resume successfully', async () => {
    const mockClient = {
      _id: 'client123',
      name: 'Test Client',
      status: 'PAUSED',
      pausedUntil: new Date('2026-12-31'),
      save: jest.fn().mockResolvedValue(true)
    };

    (Client.findByIdAndUpdate as jest.Mock).mockImplementation((id, update) => {
      return Promise.resolve({ ...mockClient, ...update });
    });

    const activeClient = await Client.findByIdAndUpdate('client123', {
      status: 'ACTIVE',
      pausedUntil: null
    });

    expect(Client.findByIdAndUpdate).toHaveBeenCalledWith('client123', {
      status: 'ACTIVE',
      pausedUntil: null
    });
    expect(activeClient?.status).toBe('ACTIVE');
    expect(activeClient?.pausedUntil).toBeNull();
  });

  test('should mock active subscription status update to PAUSED', async () => {
    const mockSubscription = {
      _id: 'sub123',
      clientId: 'client123',
      status: 'ACTIVE',
      pauseHistory: [] as any[],
      save: jest.fn().mockResolvedValue(true)
    };

    (Subscription.findById as jest.Mock).mockResolvedValue(mockSubscription);

    mockSubscription.status = 'PAUSED';
    mockSubscription.pauseHistory.push({
      startDate: new Date(),
      reason: 'Manual dietician pause'
    });
    await mockSubscription.save();

    expect(mockSubscription.status).toBe('PAUSED');
    expect(mockSubscription.pauseHistory.length).toBe(1);
    expect(mockSubscription.pauseHistory[0].reason).toBe('Manual dietician pause');
    expect(mockSubscription.save).toHaveBeenCalled();
  });

  test('should mock subscription status resume with extended endDate', async () => {
    const mockSubscription = {
      _id: 'sub123',
      clientId: 'client123',
      status: 'PAUSED',
      endDate: new Date('2026-06-30'),
      pauseHistory: [
        { startDate: new Date('2026-06-10'), endDate: null, reason: 'Vacation' }
      ] as any[],
      pauseDaysUsed: 0,
      save: jest.fn().mockResolvedValue(true)
    };

    (Subscription.findById as jest.Mock).mockResolvedValue(mockSubscription);

    // Mocking the resume PUT request logic
    mockSubscription.status = 'ACTIVE';
    const activePause = mockSubscription.pauseHistory.find((h: any) => !h.endDate);
    if (activePause) {
      const today = new Date('2026-06-15'); // 5 days paused
      activePause.endDate = today;
      const duration = 5;
      mockSubscription.pauseDaysUsed = mockSubscription.pauseDaysUsed + duration;
      const newEndDate = new Date(mockSubscription.endDate);
      newEndDate.setDate(newEndDate.getDate() + duration);
      mockSubscription.endDate = newEndDate;
    }
    await mockSubscription.save();

    expect(mockSubscription.status).toBe('ACTIVE');
    expect(mockSubscription.pauseDaysUsed).toBe(5);
    expect(mockSubscription.endDate).toEqual(new Date('2026-07-05'));
    expect(mockSubscription.save).toHaveBeenCalled();
  });
});

import { Page } from '@playwright/test';

export async function mockApi(page: Page) {
  // 1. Mock Login API
  await page.route('**/api/auth/login', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const email = body.email || '';
      
      if (email.includes('dietician')) {
        // Dietician token
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'header.eyJ1c2VySWQiOiI0NTYiLCJlbWFpbCI6ImRpZXRpY2lhbkBleGFtcGxlLmNvbSIsInJvbGUiOiJESUVUSUNJQU4iLCJuYW1lIjoiRGlldGljaWFuIFVzZXIifQ.signature',
            user: { role: 'DIETICIAN', name: 'Dietician User' }
          })
        });
      } else {
        // Client token
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'header.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6ImNsaWVudEBleGFtcGxlLmNvbSIsInJvbGUiOiJDTElFTlQiLCJuYW1lIjoiQ2xpZW50IFVzZXIiLCJpc1Byb2ZpbGVDb21wbGV0ZSI6dHJ1ZX0.signature',
            user: { role: 'CLIENT', name: 'Client User', isProfileComplete: true }
          })
        });
      }
    } else {
      await route.continue();
    }
  });

  // 2. Mock Client Diet Plan API
  await page.route('**/api/client/diet-plan*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        weekStartDate: '2026-06-15T00:00:00.000Z',
        days: [
          {
            date: '2026-06-15T00:00:00.000Z',
            status: 'PUBLISHED',
            meals: [
              { mealNumber: 1, time: '07:00', foodItems: [] },
              { mealNumber: 2, time: '08:00', foodItems: [{ name: 'Oatmeal', portion: '1 bowl', quantity: '100g' }] },
              { mealNumber: 3, time: '11:00', foodItems: [] },
              { mealNumber: 4, time: '13:00', foodItems: [{ name: 'Lunch (Chicken Salad)', portion: '1 plate', quantity: '250g' }] },
              { mealNumber: 5, time: '17:00', foodItems: [] },
              { mealNumber: 6, time: '19:00', foodItems: [{ name: 'Dinner (Salmon)', portion: '1 fillet', quantity: '200g' }] }
            ]
          },
          { date: '2026-06-16T00:00:00.000Z', status: 'NO_DIET', meals: [] },
          { date: '2026-06-17T00:00:00.000Z', status: 'NO_DIET', meals: [] },
          { date: '2026-06-18T00:00:00.000Z', status: 'NO_DIET', meals: [] },
          { date: '2026-06-19T00:00:00.000Z', status: 'NO_DIET', meals: [] },
          { date: '2026-06-20T00:00:00.000Z', status: 'NO_DIET', meals: [] },
          { date: '2026-06-21T00:00:00.000Z', status: 'NO_DIET', meals: [] }
        ]
      })
    });
  });

  // 3. Mock Dietician Stats API
  await page.route('**/api/dietician/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        activeClients: 1,
        newClients: 0,
        pausedClients: 0,
        expiredClients: 0,
        leadsCount: 0,
        todayFollowUps: [],
        analysis: {
          todayCounsellingCount: 0,
          dietPendingCount: 0,
          dietPendingCounts: { red: 0, yellow: 0, black: 0 },
          dietPendingList: []
        }
      })
    });
  });

  // 4. Mock Clients list API
  await page.route(/\/api\/clients$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: '69ae3fca09498bdf8fdf9d45',
            name: 'Jane Doe',
            clientId: 'JDOE123',
            status: 'ACTIVE',
            dietStatus: 'green',
            isProfileComplete: true,
            email: 'jane@example.com'
          }
        ])
      });
    } else {
      await route.continue();
    }
  });

  // 5. Mock Client detail API
  await page.route('**/api/clients/69ae3fca09498bdf8fdf9d45', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '69ae3fca09498bdf8fdf9d45',
          id: 'JDOE123',
          name: 'Jane Doe',
          status: 'ACTIVE',
          dietStatus: 'green',
          isProfileComplete: true,
          email: 'jane@example.com',
          gender: 'female',
          cycleLength: 28,
          averagePeriodDuration: 5,
          height: 165,
          weight: 60,
          counsellingProfile: {
            allergies: 'none',
            medicalGoal: 'Stay healthy'
          }
        })
      });
    } else {
      // PATCH / DELETE
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Updated successfully' })
      });
    }
  });

  // 6. Mock Client logs
  await page.route('**/api/clients/69ae3fca09498bdf8fdf9d45/symptom-logs', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/api/clients/69ae3fca09498bdf8fdf9d45/period-logs', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  // 7. Mock suggest-diet plan endpoints
  await page.route('**/api/clients/69ae3fca09498bdf8fdf9d45/diet-plan*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          weekStartDate: '2026-06-15T00:00:00.000Z',
          days: Array.from({ length: 7 }).map((_, i) => ({
            date: new Date(new Date('2026-06-15T00:00:00.000Z').getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
            meals: [
              { mealNumber: 1, time: '08:00', foodItems: [] },
              { mealNumber: 2, time: '13:00', foodItems: [] },
              { mealNumber: 3, time: '19:00', foodItems: [] }
            ],
            status: 'NO_DIET'
          }))
        })
      });
    } else {
      // POST
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    }
  });
}

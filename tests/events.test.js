// tests/events.test.js
const request = require('supertest');
const app = require('../app');

describe('Events API Endpoints', () => {
  describe('GET /api/events/monthly/:locationId', () => {
    it('should return monthly time series for valid location', async () => {
      const response = await request(app)
        .get('/api/events/monthly/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('locationId', 1);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const dataPoint = response.body.data[0];
        expect(dataPoint).toHaveProperty('month');
        expect(dataPoint).toHaveProperty('total_count');
        expect(dataPoint).toHaveProperty('location_name');
        expect(typeof dataPoint.total_count).toBe('string'); // PostgreSQL returns as string
        expect(new Date(dataPoint.month)).toBeInstanceOf(Date);
      }
    });

    it('should return data ordered by month ascending', async () => {
      const response = await request(app)
        .get('/api/events/monthly/1')
        .expect(200);

      const months = response.body.data.map(d => new Date(d.month));
      for (let i = 1; i < months.length; i++) {
        expect(months[i].getTime()).toBeGreaterThanOrEqual(months[i-1].getTime());
      }
    });

    it('should handle invalid location ID gracefully', async () => {
      const response = await request(app)
        .get('/api/events/monthly/99999')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('locationId', 99999);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual([]);
    });

    it('should handle non-numeric location ID', async () => {
      const response = await request(app)
        .get('/api/events/monthly/invalid')
        .expect('Content-Type', /json/);

      // Should either return 400 or handle gracefully
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should group events by month correctly', async () => {
      const response = await request(app)
        .get('/api/events/monthly/1')
        .expect(200);

      // Check that each month appears only once
      const months = response.body.data.map(d => d.month);
      const uniqueMonths = [...new Set(months)];
      expect(months.length).toBe(uniqueMonths.length);
    });
  });

  describe('GET /api/events/recent/:locationId', () => {
    it('should return recent events for valid location', async () => {
      const response = await request(app)
        .get('/api/events/recent/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('locationId', 1);
      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.events.length).toBeLessThanOrEqual(3);

      if (response.body.events.length > 0) {
        const event = response.body.events[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('count');
        expect(event).toHaveProperty('date');
        expect(event).toHaveProperty('location_id');
        expect(event).toHaveProperty('location_name');
        expect(event).toHaveProperty('timezone');
        expect(event.location_id).toBe(1);
        expect(typeof event.count).toBe('number');
        expect(new Date(event.date)).toBeInstanceOf(Date);
      }
    });

    it('should return events ordered by date descending (most recent first)', async () => {
      const response = await request(app)
        .get('/api/events/recent/1')
        .expect(200);

      const dates = response.body.events.map(e => new Date(e.date));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i].getTime()).toBeLessThanOrEqual(dates[i-1].getTime());
      }
    });

    it('should return maximum 3 events', async () => {
      const response = await request(app)
        .get('/api/events/recent/1')
        .expect(200);

      expect(response.body.events.length).toBeLessThanOrEqual(3);
    });

    it('should handle location with no events', async () => {
      const response = await request(app)
        .get('/api/events/recent/99999')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('locationId', 99999);
      expect(response.body).toHaveProperty('events');
      expect(response.body.events).toEqual([]);
    });

    it('should include location details in response', async () => {
      const response = await request(app)
        .get('/api/events/recent/1')
        .expect(200);

      if (response.body.events.length > 0) {
        const event = response.body.events[0];
        expect(event.location_name).toBeTruthy();
        expect(event.timezone).toBeTruthy();
        expect(typeof event.location_name).toBe('string');
        expect(typeof event.timezone).toBe('string');
      }
    });
  });

  describe('Database Connection Tests', () => {
    it('should connect to database successfully', async () => {
      const response = await request(app)
        .get('/api/test-connection')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('database');
      expect(response.body.user).toBe('applicant_user');
      expect(response.body.database).toBe('baseoperations-db');
    });

    it('should return sample data from both tables', async () => {
      const response = await request(app)
        .get('/api/test-data')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('locations');
      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.locations)).toBe(true);
      expect(Array.isArray(response.body.events)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/events/nonexistent')
        .expect(404);
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousId = "1; DROP TABLE events; --";
      const response = await request(app)
        .get(`/api/events/recent/${encodeURIComponent(maliciousId)}`)
        .expect('Content-Type', /json/);

      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent JSON structure for monthly endpoint', async () => {
      const response = await request(app)
        .get('/api/events/monthly/1')
        .expect(200);

      expect(response.body).toMatchObject({
        locationId: expect.any(Number),
        data: expect.any(Array)
      });
    });

    it('should return consistent JSON structure for recent endpoint', async () => {
      const response = await request(app)
        .get('/api/events/recent/1')
        .expect(200);

      expect(response.body).toMatchObject({
        locationId: expect.any(Number),
        events: expect.any(Array)
      });
    });
  });

  describe('Performance Tests', () => {
    it('should respond within reasonable time for monthly data', async () => {
      const startTime = Date.now();
      await request(app)
        .get('/api/events/monthly/1')
        .expect(200);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(5000);
    }, 10000);

    it('should respond within reasonable time for recent events', async () => {
      const startTime = Date.now();
      await request(app)
        .get('/api/events/recent/1')
        .expect(200);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(2000);
    }, 5000);
  });
});
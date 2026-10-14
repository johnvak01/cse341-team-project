import {describe, expect, test} from 'vitest';
import request from 'supertest';
import app from '../app.js'; 

describe('GET /api/trips with pagination, filter and search', () => {
    
    test('returns the first page of trips with default limit', async () => {
        const response = await request(app).get('/api/trips?page=1&limit=4');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(4); // Assuming limit is 4
        expect(response.body.pagination).toMatchObject({
            page: 1,
            limit: 4,
            totalItems: 6,
            totalPages: 2,
            hasNextPage: true,
            hasPreviousPage: false
        });
    });

    test('returns a second page with partial page of trips', async () => {

        const response = await request(app).get('/api/trips?page=2&limit=4');


        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2); // Assuming limit is 4 and total items are 6
        expect(response.body.pagination).toMatchObject({
            page: 2,
            limit: 4,
            totalItems: 6,
            totalPages: 2,
            hasNextPage: false,
            hasPreviousPage: true
        });
    });

    test('returns filtered trips by region', async () => {

        const response = await request(app).get('/api/trips?region=central');


        expect(response.status).toBe(200);
        expect(response.body.data.every(trip => trip.region === 'central')).toBe(true);
    });

    test('returns searched trips by season', async () => {

        const response = await request(app).get('/api/trips?season=winter');


        expect(response.status).toBe(200);
        expect(response.body.data.every(trip => trip.bestSeason === 'winter')).toBe(true);
    });

    test('return search trips by region and season together', async () => {

        const response = await request(app).get('/api/trips?region=central&season=autumn');


        expect(response.status).toBe(200);
        expect(response.body.data.every(trip => trip.region === 'central' && trip.bestSeason === 'autumn')).toBe(true);
    });

    test('return every trip whose name or description contains the keyword', async() =>{

        const response = await request(app).get('/api/trips?search=gorge');

        expect(response.status).toBe(200);
        
        const ids = response.body.data.map((trip) => trip.id);

        expect(ids).toEqual(['gorge-explorer', 'romantic-gorge']);
        expect(ids).not.toContain('alpine-panorama');
        expect(response.body.pagination.totalItems).toBe(2);

        const keyword = 'gorge';
        const matches = (trip) => trip.name.toLowerCase().includes(keyword) || trip.description.toLowerCase().includes(keyword);

        expect(response.body.data.every(matches)).toBe(true);
    });

    test('return empty array when search do not find a trip', async () => {

        const response = await request(app).get('/api/trips?region=kansai&&season=winter');

        expect(response.status).toBe(200);
        expect(response.body.data.every(trip => trip.region === 'kansai' && trip.bestSeason === 'winter'));
        expect(response.body.pagination).toMatchObject({
            page: 1,
            limit: 10,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
        });
    });

});
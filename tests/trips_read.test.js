import {describe, expect, test} from 'vitest';
import request from 'supertest';
import app from '../app.js'; 

describe('GET /api/trips', () => {
    test('returns the available trips', async () => {
        const response = await request(app).get('/api/trips');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(6);
        expect(response.body.data[0]).toMatchObject({"id": "alpine-panorama",
        "name": "Alpine Panorama Express",
        "description": "Journey through the Japanese Alps with stunning mountain views and traditional villages.",
        "region": "central",
        "startStation": "nagoya",
        "endStation": "toyama",
        "trainId": "series-e353",
        "duration": "4.5 hours",
        "distance": 180,
        "highlights": [
            "Mount Tateyama views",
            "Hida River gorge",
            "Traditional alpine villages" 
        ],
        "bestSeason": "autumn",
        "operatingMonths": [
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11
        ],
        "imageUrl": "/images/routes/alpine-panorama.png"
    });
    })
})

describe('GET /api/trips/:id', () => {
    test('returns the trip with the given id', async () => {
        const response = await request(app).get('/api/trips/alpine-panorama');

        
        expect(response.status).toBe(200);
        expect(response.body.name).toEqual('Alpine Panorama Express');
        
    })

    test('returns 404 if the trip does not exist', async () => {
        const response = await request(app).get('/api/trips/fuji-mountain');

        
        expect(response.status).toBe(404);
        expect(response.body.message).toEqual('Trip not found');
    })
});
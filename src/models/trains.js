import { getDb } from '../db/connect.js';

export async function getTrainById(id) {
    const db = getDb();
    return db.collection('trains').findOne({ id });
}

export async function getAllTrains() {
    const db = getDb();
    return db.collection('trains').find({}).toArray();
}



import { closeDb, connectToDb } from './connect.js';
import { initializeDatabase } from './initialize.js';
import { User } from '../models/schemas/users.js';
import { Role } from '../models/schemas/roles.js';
import { Booking } from `../models/schemas/bookings.js`

try {
  const db = await connectToDb();
  await initializeDatabase(db);
  console.log('MongoDB import complete.');
} finally {
  await closeDb();
}

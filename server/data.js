/**
 * Seed data for a freshly created user.
 *
 * Every user gets the same 12 bookings, so tests can rely on the starting
 * state without depending on anything another test did.
 */

export const sampleNames = [
  'Priya Raman',
  'Daniel Okafor',
  'Mei Ling Chen',
  'Aarav Sharma',
  'Sofia Kowalski',
  'Tomas Novak',
  'Fatima Al-Hassan',
  'James Whitfield',
  'Lucia Ferrari',
  'Kwame Mensah',
  'Elena Petrova',
  'Rohan Iyer',
];

const rows = [
  { flightNumber: 'W6501', seats: 2, departureDate: '2026-09-14', status: 'Confirmed' },
  { flightNumber: 'W6318', seats: 1, departureDate: '2026-09-16', status: 'Pending' },
  { flightNumber: 'W62204', seats: 4, departureDate: '2026-09-19', status: 'Confirmed' },
  { flightNumber: 'W6117', seats: 1, departureDate: '2026-09-21', status: 'Cancelled' },
  { flightNumber: 'W6842', seats: 3, departureDate: '2026-09-23', status: 'Confirmed' },
  { flightNumber: 'W6905', seats: 2, departureDate: '2026-09-26', status: 'Pending' },
  { flightNumber: 'W61150', seats: 1, departureDate: '2026-09-28', status: 'Confirmed' },
  { flightNumber: 'W6433', seats: 5, departureDate: '2026-10-02', status: 'Confirmed' },
  { flightNumber: 'W6772', seats: 2, departureDate: '2026-10-05', status: 'Cancelled' },
  { flightNumber: 'W6601', seats: 1, departureDate: '2026-10-08', status: 'Pending' },
  { flightNumber: 'W63012', seats: 6, departureDate: '2026-10-11', status: 'Confirmed' },
  { flightNumber: 'W6229', seats: 2, departureDate: '2026-10-15', status: 'Confirmed' },
];

/**
 * @param {() => string} nextId  supplies the next booking id
 */
export function seedBookings(nextId) {
  return rows.map((row, i) => ({
    id: nextId(),
    passenger: sampleNames[i],
    email: `${sampleNames[i].toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    ...row,
  }));
}

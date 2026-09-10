export type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled';

export interface Booking {
  id: string;
  passenger: string;
  email: string;
  flightNumber: string;
  seats: number;
  departureDate: string;
  status: BookingStatus;
}

export interface FieldErrors {
  [field: string]: string;
}

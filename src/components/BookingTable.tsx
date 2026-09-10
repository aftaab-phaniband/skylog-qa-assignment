import type { Booking } from '../types';

interface Props {
  bookings: Booking[];
  onView: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}

export function BookingTable({ bookings, onView, onCancel }: Props) {
  if (bookings.length === 0) {
    return <p className="empty-state">No bookings match your filters.</p>;
  }

  return (
    <table className="bookings-table">
      <caption className="sr-only">Bookings</caption>
      <thead>
        <tr>
          <th scope="col">Reference</th>
          <th scope="col">Passenger</th>
          <th scope="col">Flight</th>
          <th scope="col">Seats</th>
          <th scope="col">Departure</th>
          <th scope="col">Status</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => (
          <tr key={booking.id} data-testid="booking-row" data-booking-id={booking.id}>
            <td>{booking.id}</td>
            <td>{booking.passenger}</td>
            <td>{booking.flightNumber}</td>
            <td>{booking.seats}</td>
            <td>{booking.departureDate}</td>
            <td>
              <span className={`badge badge--${booking.status.toLowerCase()}`}>{booking.status}</span>
            </td>
            <td className="row-actions">
              <button
                type="button"
                className="btn btn--small"
                onClick={() => onView(booking)}
                aria-label={`View booking ${booking.id}`}
              >
                View
              </button>
              <button
                type="button"
                className="btn btn--small btn--danger"
                onClick={() => onCancel(booking)}
                disabled={booking.status === 'Cancelled'}
                aria-label={`Cancel booking ${booking.id}`}
              >
                Cancel
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { useEffect } from 'react';
import type { Booking } from '../types';

interface Props {
  booking: Booking;
  onClose: () => void;
}

export function BookingDetailDialog({ booking, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <h2 id="detail-title">Booking {booking.id}</h2>
        <dl className="detail-grid">
          <dt>Passenger</dt>
          <dd>{booking.passenger}</dd>
          <dt>Email</dt>
          <dd>{booking.email}</dd>
          <dt>Flight</dt>
          <dd>{booking.flightNumber}</dd>
          <dt>Seats</dt>
          <dd>{booking.seats}</dd>
          <dt>Departure</dt>
          <dd>{booking.departureDate}</dd>
          <dt>Status</dt>
          <dd>
            <span className={`badge badge--${booking.status.toLowerCase()}`}>{booking.status}</span>
          </dd>
        </dl>
        <div className="dialog__actions">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

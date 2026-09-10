import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, createBooking } from '../api';
import type { FieldErrors } from '../types';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FLIGHT_PATTERN = /^W6\d{3,4}$/;

interface FormState {
  passenger: string;
  email: string;
  flightNumber: string;
  seats: string;
  departureDate: string;
}

const EMPTY: FormState = {
  passenger: '',
  email: '',
  flightNumber: '',
  seats: '1',
  departureDate: '',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  const passenger = form.passenger.trim();
  if (passenger.length < 2) {
    errors.passenger = 'Passenger name must be at least 2 characters.';
  } else if (passenger.length > 60) {
    errors.passenger = 'Passenger name must be 60 characters or fewer.';
  }

  if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!FLIGHT_PATTERN.test(form.flightNumber.trim().toUpperCase())) {
    errors.flightNumber = 'Flight number must look like W6123 or W61234.';
  }

  const seats = Number(form.seats);
  if (!Number.isInteger(seats) || seats < 1 || seats > 10) {
    errors.seats = 'Seats must be a whole number between 1 and 9.';
  }

  if (!form.departureDate) {
    errors.departureDate = 'Departure date is required.';
  } else if (form.departureDate < todayIso()) {
    errors.departureDate = 'Departure date cannot be in the past.';
  }

  return errors;
}

export function NewBookingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const { booking } = await createBooking({
        passenger: form.passenger.trim(),
        email: form.email.trim(),
        flightNumber: form.flightNumber.trim().toUpperCase(),
        seats: Number(form.seats),
        departureDate: form.departureDate,
      });
      navigate('/bookings', { replace: true, state: { created: booking.id } });
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors(err.fieldErrors);
        setFormError('Please correct the highlighted fields.');
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Could not create the booking.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="brand">SkyLog</p>
        <nav className="app-header__actions">
          <Link className="btn btn--ghost" to="/bookings">
            Back to bookings
          </Link>
        </nav>
      </header>

      <main className="page page--narrow">
        <h1>New booking</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="passenger">Passenger name</label>
            <input
              id="passenger"
              value={form.passenger}
              onChange={(e) => update('passenger', e.target.value)}
              aria-invalid={Boolean(errors.passenger)}
            />
            {errors.passenger && (
              <p className="field__error" role="alert">
                {errors.passenger}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="booking-email">Contact email</label>
            <input
              id="booking-email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="field__error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="flightNumber">Flight number</label>
            <input
              id="flightNumber"
              placeholder="W6123"
              value={form.flightNumber}
              onChange={(e) => update('flightNumber', e.target.value)}
              aria-invalid={Boolean(errors.flightNumber)}
            />
            {errors.flightNumber && (
              <p className="field__error" role="alert">
                {errors.flightNumber}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="seats">Seats (1–9)</label>
            <input
              id="seats"
              type="number"
              value={form.seats}
              onChange={(e) => update('seats', e.target.value)}
              aria-invalid={Boolean(errors.seats)}
            />
            {errors.seats && (
              <p className="field__error" role="alert">
                {errors.seats}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="departureDate">Departure date</label>
            <input
              id="departureDate"
              type="date"
              value={form.departureDate}
              onChange={(e) => update('departureDate', e.target.value)}
              aria-invalid={Boolean(errors.departureDate)}
            />
            {errors.departureDate && (
              <p className="field__error" role="alert">
                {errors.departureDate}
              </p>
            )}
          </div>

          {formError && (
            <p className="alert alert--error" role="alert">
              {formError}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create booking'}
            </button>
            <Link className="btn btn--ghost" to="/bookings">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

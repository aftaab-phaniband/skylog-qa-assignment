import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, cancelBooking, fetchBookings } from '../api';
import { clearSession, getEmail } from '../auth';
import { BookingTable } from '../components/BookingTable';
import { BookingDetailDialog } from '../components/BookingDetailDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast } from '../components/Toast';
import type { Booking, BookingStatus } from '../types';

const PAGE_SIZE = 5;
const STATUS_FILTERS: Array<'All' | BookingStatus> = ['All', 'Confirmed', 'Pending', 'Cancelled'];

interface Summary {
  total: number;
  confirmed: number;
  seats: number;
}

function summarise(bookings: Booking[]): Summary {
  return {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'Confirmed').length,
    seats: bookings.reduce((sum, b) => sum + b.seats, 0),
  };
}

export function BookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, confirmed: 0, seats: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'All' | BookingStatus>('All');
  const [page, setPage] = useState(1);

  const [viewing, setViewing] = useState<Booking | null>(null);
  const [pendingCancel, setPendingCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchBookings();
      setBookings(data.bookings);
      setSummary(summarise(data.bookings));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        navigate('/login', { replace: true });
        return;
      }
      setLoadError(err instanceof ApiError ? err.message : 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim();
    return bookings.filter((booking) => {
      const matchesSearch = term === '' || booking.passenger.includes(term);
      const matchesStatus = status === 'All' || booking.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function confirmCancel() {
    if (!pendingCancel) return;
    setCancelling(true);
    try {
      const { booking } = await cancelBooking(pendingCancel.id);
      setBookings((current) => current.map((b) => (b.id === booking.id ? booking : b)));
      setToast({ message: `Booking ${booking.id} cancelled.`, tone: 'success' });
      setPendingCancel(null);
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Could not cancel the booking.',
        tone: 'error',
      });
    } finally {
      setCancelling(false);
    }
  }

  function signOut() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="brand">SkyLog</p>
        <nav className="app-header__actions">
          <span className="user-email">{getEmail()}</span>
          <Link className="btn btn--primary" to="/bookings/new">
            New booking
          </Link>
          <button type="button" className="btn btn--ghost" onClick={signOut}>
            Sign out
          </button>
        </nav>
      </header>

      <main className="page">
        <h1>Bookings</h1>

        <section className="summary" aria-label="Booking summary">
          <div className="summary__card">
            <span className="summary__label">Total bookings</span>
            <strong data-testid="summary-total">{summary.total}</strong>
          </div>
          <div className="summary__card">
            <span className="summary__label">Confirmed</span>
            <strong data-testid="summary-confirmed">{summary.confirmed}</strong>
          </div>
          <div className="summary__card">
            <span className="summary__label">Seats booked</span>
            <strong data-testid="summary-seats">{summary.seats}</strong>
          </div>
        </section>

        <section className="filters">
          <div className="field field--inline">
            <label htmlFor="search">Search passenger</label>
            <input
              id="search"
              type="search"
              placeholder="e.g. Priya"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="field field--inline">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'All' | BookingStatus);
                setPage(1);
              }}
            >
              {STATUS_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading && (
          <p className="loading" data-testid="bookings-loading">
            Loading bookings…
          </p>
        )}

        {!loading && loadError && (
          <div className="alert alert--error" role="alert">
            <p>{loadError}</p>
            <button type="button" className="btn" onClick={() => void load()}>
              Retry
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <>
            <BookingTable bookings={visible} onView={setViewing} onCancel={setPendingCancel} />

            <div className="pagination">
              <button
                type="button"
                className="btn btn--small"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span data-testid="page-indicator">
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                className="btn btn--small"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>

      {viewing && <BookingDetailDialog booking={viewing} onClose={() => setViewing(null)} />}

      {pendingCancel && (
        <ConfirmDialog
          title="Cancel this booking?"
          body={`Booking ${pendingCancel.id} for ${pendingCancel.passenger} will be cancelled. This cannot be undone.`}
          confirmLabel="Cancel booking"
          busy={cancelling}
          onConfirm={() => void confirmCancel()}
          onCancel={() => setPendingCancel(null)}
        />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}

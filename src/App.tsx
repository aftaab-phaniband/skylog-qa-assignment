import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { BookingsPage } from './pages/BookingsPage';
import { NewBookingPage } from './pages/NewBookingPage';
import { getToken } from './auth';

function RequireAuth({ children }: { children: JSX.Element }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/bookings" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/bookings"
        element={
          <RequireAuth>
            <BookingsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/bookings/new"
        element={
          <RequireAuth>
            <NewBookingPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/bookings" replace />} />
    </Routes>
  );
}

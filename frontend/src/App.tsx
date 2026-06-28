import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import EntityDetail from './pages/EntityDetail';
import Dashboard from './pages/Dashboard';
import { useAuth } from './hooks/useAuth';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, login, register, logout, updateUser, loginWithSession } = useAuth();

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Landing user={user} />} />
          <Route path="/login" element={<Login onLogin={login} onSession={loginWithSession} />} />
          <Route path="/register" element={<Register onRegister={register} />} />
          <Route
            path="/search"
            element={
              <RequireAuth>
                <Search />
              </RequireAuth>
            }
          />
          <Route
            path="/entity/:id"
            element={
              <RequireAuth>
                <EntityDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard user={user} onUserUpdate={updateUser} />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <InstallPrompt />
    </BrowserRouter>
  );
}

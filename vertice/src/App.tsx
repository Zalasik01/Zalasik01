import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import { AppLayout } from './layouts/AppLayout'
import { Toasts } from './components/Toasts'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import Clients from './pages/Clients'
import Proposals from './pages/Proposals'
import ProposalEditor from './pages/ProposalEditor'
import PublicProposal from './pages/PublicProposal'
import Copilot from './pages/Copilot'
import Settings from './pages/Settings'

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useStore()
  const loc = useLocation()
  if (!session) return <Navigate to="/entrar" state={{ from: loc.pathname }} replace />
  return <>{children}</>
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/entrar" element={<Auth mode="login" />} />
        <Route path="/criar-conta" element={<Auth mode="signup" />} />
        <Route path="/p/:id" element={<PublicProposal />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="propostas" element={<Proposals />} />
          <Route path="propostas/:id" element={<ProposalEditor />} />
          <Route path="copiloto" element={<Copilot />} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </>
  )
}

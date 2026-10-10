import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Shell } from './components/Shell'
import Landing from './pages/Landing'
import Carteira from './pages/Carteira'
import EmpresaPage from './pages/Empresa'
import Calculadora from './pages/Calculadora'
import Calendario from './pages/Calendario'
import Importar from './pages/Importar'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Shell />}>
          <Route index element={<Carteira />} />
          <Route path="empresa/:id" element={<EmpresaPage />} />
          <Route path="calculadora" element={<Calculadora />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="importar" element={<Importar />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

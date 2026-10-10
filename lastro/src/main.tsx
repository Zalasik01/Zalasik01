import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, MemoryRouter } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import App from './App'
import './index.css'

// Dentro de um iframe isolado (ex.: visualizador de artifacts) a URL pode não aceitar navegação por hash
// (about:srcdoc, history bloqueado). Nesse caso a navegação fica em memória.
function podeUsarHash() {
  try {
    if (window.self !== window.top) return false
    new URL(window.location.href)
    window.history.replaceState(window.history.state, '', window.location.href)
    return true
  } catch {
    return false
  }
}
const Router = podeUsarHash() ? HashRouter : MemoryRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <StoreProvider>
        <App />
      </StoreProvider>
    </Router>
  </StrictMode>,
)

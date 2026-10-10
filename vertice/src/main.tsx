import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import App from './App'
import './index.css'

// A navegação fica em memória: o endereço da página nunca muda. Isso funciona em qualquer hospedagem,
// inclusive em visualizadores que bloqueiam ou reinterpretam mudanças de URL e de hash.
// Links internos do tipo "#secao" rolam até a seção sem tocar no endereço.
document.addEventListener('click', (ev) => {
  const a = (ev.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
  if (!a) return
  ev.preventDefault()
  document.getElementById(a.getAttribute('href')!.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

class ErrorBoundary extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state = { erro: null as Error | null }
  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }
  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#e5e5e5', background: '#111', minHeight: '100vh' }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Algo deu errado ao abrir esta tela.</p>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Recarregue a página. Se continuar, envie a mensagem abaixo para o suporte.</p>
        <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap', fontSize: 12, opacity: 0.8 }}>{String(this.state.erro.stack || this.state.erro.message)}</pre>
      </div>
    )
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <MemoryRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </MemoryRouter>
    </ErrorBoundary>
  </StrictMode>,
)

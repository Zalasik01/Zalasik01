import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { criarCarteira } from './seed'
import { projecao, type Cenario, type Empresa } from './engine'

const KEY = 'lastro:carteira:v1'

function carregar(): Empresa[] | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Empresa[]) : null
  } catch {
    return null
  }
}

interface Store {
  empresas: Empresa[]
  hoje: Date
  cenario: Cenario
  setCenario: (c: Cenario) => void
  adicionar: (e: Empresa) => void
  atualizar: (id: string, patch: Partial<Empresa>) => void
  remover: (id: string) => void
  restaurar: () => void
  aviso: string | null
  avisar: (msg: string) => void
  analise: (e: Empresa) => ReturnType<typeof projecao>
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const hoje = useMemo(() => new Date(), [])
  const [empresas, setEmpresas] = useState<Empresa[]>(() => carregar() ?? criarCarteira(hoje))
  const [cenario, setCenario] = useState<Cenario>('pior')
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(empresas))
    } catch {
      /* sem armazenamento: segue em memória */
    }
  }, [empresas])

  const avisar = useCallback((msg: string) => {
    setAviso(msg)
    window.setTimeout(() => setAviso((a) => (a === msg ? null : a)), 3000)
  }, [])

  const cache = useMemo(() => new Map<string, ReturnType<typeof projecao>>(), [empresas, cenario])

  const value = useMemo<Store>(
    () => ({
      empresas,
      hoje,
      cenario,
      setCenario,
      aviso,
      avisar,
      adicionar: (e) => setEmpresas((xs) => [e, ...xs]),
      atualizar: (id, patch) => setEmpresas((xs) => xs.map((e) => (e.id === id ? { ...e, ...patch } : e))),
      remover: (id) => setEmpresas((xs) => xs.filter((e) => e.id !== id)),
      restaurar: () => setEmpresas(criarCarteira(hoje)),
      analise: (e) => {
        let r = cache.get(e.id)
        if (!r) {
          r = projecao(e, hoje, cenario)
          cache.set(e.id, r)
        }
        return r
      },
    }),
    [empresas, hoje, cenario, aviso, avisar, cache],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore fora do provider')
  return c
}

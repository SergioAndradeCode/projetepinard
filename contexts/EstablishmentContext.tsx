'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface EstablishmentContextType {
  selectedEstablishmentId: string | null
  setSelectedEstablishmentId: (id: string | null) => void
}

const EstablishmentContext = createContext<EstablishmentContextType>({
  selectedEstablishmentId: null,
  setSelectedEstablishmentId: () => {},
})

export function EstablishmentProvider({ children }: { children: ReactNode }) {
  const [selectedEstablishmentId, setSelectedEstablishmentIdRaw] = useState<string | null>(null)

  const setSelectedEstablishmentId = useCallback((id: string | null) => {
    setSelectedEstablishmentIdRaw(id)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (id) {
        url.searchParams.set('site', id)
      } else {
        url.searchParams.delete('site')
      }
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  return (
    <EstablishmentContext.Provider value={{ selectedEstablishmentId, setSelectedEstablishmentId }}>
      {children}
    </EstablishmentContext.Provider>
  )
}

export const useEstablishment = () => useContext(EstablishmentContext)

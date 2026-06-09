'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/types'

interface ProfileContextValue {
  profile: Profile | null
  orgId: string | null
  /** Null pour admin/charge_site (scope org entier). Valorisé pour charge_mission/lecteur. */
  establishmentId: string | null
  /** Raccourci vers profile.role — évite de tester profile?.role partout */
  role: string | null
}

/** Rôles restreints au périmètre d'un seul établissement */
export const SCOPED_ROLES = ['charge_mission', 'lecteur'] as const

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  orgId: null,
  establishmentId: null,
  role: null,
})

export function ProfileProvider({
  profile,
  children,
}: {
  profile: Profile | null
  children: React.ReactNode
}) {
  const role = profile?.role ?? null
  const isScoped = role !== null && (SCOPED_ROLES as readonly string[]).includes(role)
  const establishmentId = isScoped ? (profile?.establishment_id ?? null) : null

  return (
    <ProfileContext.Provider value={{
      profile,
      orgId: profile?.organization_id ?? null,
      establishmentId,
      role,
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

/**
 * Hook, lit le profil chargé une seule fois dans le Server Component layout.
 * Évite les appels redondants getUser() + profiles.select() dans chaque page client.
 */
export function useProfile() {
  return useContext(ProfileContext)
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Cette page a été remplacée par le profil salarié /rqth/[id]
// Redirection automatique pour éviter des liens cassés
export default function MaintienRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/rqth')
  }, [router])
  return null
}

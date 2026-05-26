import { Badge } from '@/components/ui/badge'
import { getStatutRQTH } from '@/lib/oeth/calculs'

interface BadgeStatutProps {
  dateFin: string | null
  estPermanent: boolean
}

export function BadgeStatut({ dateFin, estPermanent }: BadgeStatutProps) {
  const statut = getStatutRQTH(dateFin, estPermanent)

  if (statut === 'actif') return <Badge variant="success">Actif</Badge>
  if (statut === 'expire_bientot') return <Badge variant="warning">Expire bientôt</Badge>
  return <Badge variant="danger">Expiré</Badge>
}

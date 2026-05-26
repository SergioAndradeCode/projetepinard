import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#EBF2FA] text-[#1E4A8C]',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-orange-100 text-[#BF5A00]',
        danger: 'bg-red-100 text-[#B71C1C]',
        secondary: 'bg-[#F1F5F9] text-[#6B7280]',
        outline: 'border border-[#E2E8F0] text-[#1A1A2E]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ 
  children, 
  className = '',
  padding = 'md',
  hover = false 
}: CardProps) {
  return (
    <div className={cn(
      'bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))]',
      paddingMap[padding],
      hover && 'hover:border-[hsl(var(--primary))] transition-colors',
      className
    )}>
      {children}
    </div>
  )
}


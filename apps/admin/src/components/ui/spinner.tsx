import { LoaderIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends Omit<React.ComponentPropsWithoutRef<"svg">, "size"> {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}

function Spinner({ 
  size = 'md',
  className, 
  ...props 
}: SpinnerProps) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", sizeClasses[size], className)}
      {...props}
    />
  )
}

export { Spinner }

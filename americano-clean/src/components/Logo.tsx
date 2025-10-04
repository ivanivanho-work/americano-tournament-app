import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className={cn('text-gray-500 font-bold tracking-wide', sizeClasses[size])}>
        <span className="text-2xl font-bold text-gray-600">IVSLAB</span>
      </div>
    </div>
  )
}
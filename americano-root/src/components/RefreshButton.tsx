'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface RefreshButtonProps {
  onRefresh: () => void
  size?: "sm" | "lg"
  variant?: "outline" | "ghost" | "secondary"
  iconOnly?: boolean
}

export function RefreshButton({ onRefresh, size = "sm", variant = "outline", iconOnly = false }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      // Add a small delay to show the animation
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  return (
    <Button
      onClick={handleRefresh}
      variant={variant}
      size={size}
      disabled={isRefreshing}
      className={`flex items-center ${iconOnly ? 'px-2' : 'space-x-2'}`}
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {!iconOnly && <span className="hidden sm:inline">Refresh</span>}
    </Button>
  )
}
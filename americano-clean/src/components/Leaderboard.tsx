'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award, Crown } from "lucide-react"
import { cn, getPlayerInitials } from "@/lib/utils"

interface LeaderboardPlayer {
  id: string
  name: string
  totalPoints: number
}

interface LeaderboardProps {
  players: LeaderboardPlayer[]
  className?: string
}

export function Leaderboard({ players, className }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.totalPoints - a.totalPoints)

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
            {position}
          </div>
        )
    }
  }

  const getPositionColors = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200"
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
      default:
        return "bg-white border-gray-200"
    }
  }

  if (players.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-primary-500" />
            <span>Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No scores yet. Start playing to see the leaderboard!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-primary-500" />
          <span>Leaderboard</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedPlayers.map((player, index) => {
            const position = index + 1
            const isLeader = position === 1 && player.totalPoints > 0

            return (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200",
                  getPositionColors(position),
                  isLeader && "shadow-glow animate-pulse-slow"
                )}
              >
                <div className="flex items-center space-x-4">
                  {/* Position */}
                  <div className="flex-shrink-0">
                    {getPositionIcon(position)}
                  </div>

                  {/* Player Avatar & Name */}
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg",
                      position === 1 ? "bg-gradient-to-br from-yellow-400 to-yellow-600" :
                      position === 2 ? "bg-gradient-to-br from-gray-400 to-gray-600" :
                      position === 3 ? "bg-gradient-to-br from-amber-400 to-amber-600" :
                      "bg-gradient-to-br from-primary-400 to-primary-600"
                    )}>
                      {getPlayerInitials(player.name)}
                    </div>
                    <div>
                      <div className={cn(
                        "font-semibold text-black",
                        position <= 3 ? "text-lg" : "text-base"
                      )}>
                        {player.name}
                      </div>
                      {position === 1 && player.totalPoints > 0 && (
                        <div className="text-sm text-yellow-600 font-medium">
                          Tournament Leader
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className={cn(
                    "font-bold",
                    position === 1 ? "text-2xl text-yellow-600" :
                    position === 2 ? "text-xl text-gray-600" :
                    position === 3 ? "text-xl text-amber-600" :
                    "text-lg text-gray-700"
                  )}>
                    {player.totalPoints}
                  </div>
                  <div className="text-sm text-gray-500">
                    {player.totalPoints === 1 ? 'point' : 'points'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        {players.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-500">
                  {players.length}
                </div>
                <div className="text-sm text-gray-600">Players</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-500">
                  {Math.max(...players.map(p => p.totalPoints))}
                </div>
                <div className="text-sm text-gray-600">High Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-500">
                  {players.reduce((sum, p) => sum + p.totalPoints, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
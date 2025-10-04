'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateTournamentStats, formatDuration } from "@/lib/tournament-calculator"
import { Clock, Users, Trophy, Target } from "lucide-react"

interface TournamentProgressProps {
  tournament: any
  currentRound?: any
  engine?: any
}

export function TournamentProgress({ tournament, currentRound, engine }: TournamentProgressProps) {
  // Use stored maxRounds or calculate as fallback
  const maxRounds = tournament.maxRounds || calculateTournamentStats(
    tournament.players.length,
    tournament.numberOfCourts || 1,
    tournament.pointsPerMatch,
    tournament.targetDuration || 105
  ).totalRounds

  const stats = {
    totalRounds: maxRounds,
    playersPerRound: Math.min(Math.floor(tournament.players.length / 4), tournament.numberOfCourts || 1) * 4,
    totalMatches: maxRounds * Math.min(Math.floor(tournament.players.length / 4), tournament.numberOfCourts || 1),
    estimatedDuration: tournament.targetDuration || 105
  }

  const allRounds = tournament.rounds || []
  const completedRounds = allRounds.filter((r: any) => r.status === 'COMPLETED').length
  const currentRoundNumber = currentRound?.roundNumber || 0
  const progress = maxRounds > 0 ? (completedRounds / maxRounds) * 100 : 0

  // Current round match completion
  const currentRoundMatches = currentRound?.matches || []
  const completedMatches = currentRoundMatches.filter((m: any) => m.status === 'COMPLETED').length
  const totalCurrentMatches = currentRoundMatches.length
  const currentRoundProgress = totalCurrentMatches > 0 ? (completedMatches / totalCurrentMatches) * 100 : 0

  if (tournament.players.length < 4) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary-500" />
            <span>Tournament Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600">Need at least 4 players to start tournament</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-primary-500" />
          <span>Tournament Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tournament Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Round {currentRoundNumber} of {stats.totalRounds}</span>
            <span className="font-medium text-primary-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Start</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Current Round Progress */}
        {currentRound && totalCurrentMatches > 0 && (
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Current Round Matches</span>
              <span className="font-medium text-blue-600">{completedMatches}/{totalCurrentMatches}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentRoundProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-600">
              {completedMatches === totalCurrentMatches ? (
                <span className="text-green-600 font-medium">✓ All matches completed - ready for next round</span>
              ) : (
                <span>{totalCurrentMatches - completedMatches} matches remaining</span>
              )}
            </div>
          </div>
        )}

        {/* Tournament Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center space-x-2 text-sm">
            <Trophy className="w-4 h-4 text-primary-500" />
            <div>
              <div className="font-medium text-black">{stats.totalRounds}</div>
              <div className="text-gray-600">Total Rounds</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Users className="w-4 h-4 text-primary-500" />
            <div>
              <div className="font-medium text-black">{stats.playersPerRound}</div>
              <div className="text-gray-600">Playing/Round</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Target className="w-4 h-4 text-primary-500" />
            <div>
              <div className="font-medium text-black">{stats.totalMatches}</div>
              <div className="text-gray-600">Total Matches</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-primary-500" />
            <div>
              <div className="font-medium text-black">{formatDuration(stats.estimatedDuration)}</div>
              <div className="text-gray-600">Est. Duration</div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            {progress === 0 && (
              <>🏁 <strong>Ready to start!</strong> {stats.playersPerRound} players will play in Round 1.</>
            )}
            {progress > 0 && progress < 100 && (
              <>⚡ <strong>In progress:</strong> {completedRounds} of {stats.totalRounds} rounds completed.</>
            )}
            {progress === 100 && (
              <>🏆 <strong>Tournament Complete!</strong> All {stats.totalRounds} rounds finished.</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
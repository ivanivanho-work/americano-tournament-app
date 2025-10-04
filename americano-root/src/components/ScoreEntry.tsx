'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Minus, Trophy, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScoreEntryProps {
  match: {
    id: string
    player1Name: string
    player2Name: string
    player3Name: string
    player4Name: string
    courtNumber?: number
    team1Score?: number
    team2Score?: number
  }
  pointsPerMatch: number
  onScoreSubmit: (matchId: string, team1Score: number, team2Score: number) => void
  onCancel?: () => void
}

export function ScoreEntry({ match, pointsPerMatch, onScoreSubmit, onCancel }: ScoreEntryProps) {
  const [team1Score, setTeam1Score] = useState(match.team1Score || 0)
  const [team2Score, setTeam2Score] = useState(match.team2Score || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalScore = team1Score + team2Score
  const remainingPoints = pointsPerMatch - totalScore

  const adjustScore = (team: 'team1' | 'team2', delta: number) => {
    if (team === 'team1') {
      const newScore = Math.max(0, Math.min(pointsPerMatch, team1Score + delta))
      if (newScore + team2Score <= pointsPerMatch) {
        setTeam1Score(newScore)
      }
    } else {
      const newScore = Math.max(0, Math.min(pointsPerMatch, team2Score + delta))
      if (team1Score + newScore <= pointsPerMatch) {
        setTeam2Score(newScore)
      }
    }
  }

  const handleSubmit = async () => {
    if (totalScore !== pointsPerMatch) {
      alert(`Total score must equal ${pointsPerMatch} points`)
      return
    }

    setIsSubmitting(true)
    await onScoreSubmit(match.id, team1Score, team2Score)
    setIsSubmitting(false)
  }

  const canSubmit = totalScore === pointsPerMatch && (team1Score > 0 || team2Score > 0)

  return (
    <div className="max-w-lg mx-auto">
      <Card className="mb-6">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {match.courtNumber && (
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Court {match.courtNumber}
              </span>
            )}
          </div>
          <CardTitle className="text-xl">Enter Match Score</CardTitle>
          <p className="text-gray-600">Total: {pointsPerMatch} points</p>
        </CardHeader>
      </Card>

      {/* Team 1 */}
      <Card variant="primary" className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Team ({match.player1Name} & {match.player2Name})</span>
            </div>
            <div className="text-3xl font-bold text-primary-600">
              {team1Score}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{match.player1Name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">{match.player2Name}</span>
            </div>

            {/* Score Controls */}
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => adjustScore('team1', -1)}
                disabled={team1Score === 0}
                className="w-16 h-16 rounded-full"
              >
                <Minus className="w-6 h-6" />
              </Button>

              <div className="text-4xl font-bold text-primary-600 min-w-[80px] text-center">
                {team1Score}
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => adjustScore('team1', 1)}
                disabled={totalScore >= pointsPerMatch}
                className="w-16 h-16 rounded-full"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VS Divider */}
      <div className="text-center mb-4">
        <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full font-medium">
          VS
        </span>
      </div>

      {/* Team 2 */}
      <Card variant="accent" className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Team ({match.player3Name} & {match.player4Name})</span>
            </div>
            <div className="text-3xl font-bold text-accent-600">
              {team2Score}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{match.player3Name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">{match.player4Name}</span>
            </div>

            {/* Score Controls */}
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => adjustScore('team2', -1)}
                disabled={team2Score === 0}
                className="w-16 h-16 rounded-full"
              >
                <Minus className="w-6 h-6" />
              </Button>

              <div className="text-4xl font-bold text-accent-600 min-w-[80px] text-center">
                {team2Score}
              </div>

              <Button
                variant="accent"
                size="lg"
                onClick={() => adjustScore('team2', 1)}
                disabled={totalScore >= pointsPerMatch}
                className="w-16 h-16 rounded-full"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Summary */}
      <Card className="mb-6">
        <CardContent className="text-center py-4">
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {team1Score} - {team2Score}
            </div>
            <div className={cn(
              "text-sm font-medium",
              remainingPoints === 0 ? "text-green-600" : "text-gray-600"
            )}>
              {remainingPoints > 0 ? (
                `${remainingPoints} points remaining`
              ) : remainingPoints === 0 ? (
                "✓ Ready to submit"
              ) : (
                "Score exceeds maximum"
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          variant="primary"
          size="xl"
          className="w-full"
        >
          {isSubmitting ? (
            'Submitting Score...'
          ) : (
            <>
              <Trophy className="w-5 h-5 mr-2" />
              Submit Score
            </>
          )}
        </Button>

        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
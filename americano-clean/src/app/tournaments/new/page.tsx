'use client'

import { useState } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TournamentStorage } from "@/lib/tournament-storage"
import { Footer } from "@/components/Footer"
import { Trophy, Users, ArrowLeft, Plus, X } from "lucide-react"

export default function NewTournamentPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsPerMatch: 24,
    numberOfCourts: 1,
    targetDuration: 105, // 1h 45min default
  })

  const [players, setPlayers] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addPlayer = () => {
    setPlayers(prev => [...prev, ''])
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, name: string) => {
    setPlayers(prev => prev.map((player, i) => i === index ? name : player))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Filter out empty player names
      const filteredPlayers = players.filter(name => name.trim() !== '')

      if (filteredPlayers.length < 4) {
        alert('Please add at least 4 players to create a tournament.')
        setIsSubmitting(false)
        return
      }

      // Create the tournament
      const tournamentId = TournamentStorage.createTournament({
        name: formData.name,
        description: formData.description,
        pointsPerMatch: formData.pointsPerMatch,
        numberOfCourts: formData.numberOfCourts,
        targetDuration: formData.targetDuration,
        playerNames: filteredPlayers,
      })

      // Redirect to the new tournament page
      router.push(`/tournaments/${tournamentId}`)
    } catch (error) {
      console.error('Error creating tournament:', error)
      alert('Failed to create tournament. Please try again.')
      setIsSubmitting(false)
    }
  }

  const validPlayers = players.filter(name => name.trim() !== '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-white/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/tournaments" className="flex items-center space-x-3">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-black">New Tournament</h1>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Tournament Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-primary-500" />
                <span>Tournament Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="Tournament Name"
                placeholder="Enter tournament name..."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />

              <Input
                label="Description (Optional)"
                placeholder="Add a description for your tournament..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  Points Per Match
                </label>
                <select
                  className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-base text-black transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={formData.pointsPerMatch}
                  onChange={(e) => handleInputChange('pointsPerMatch', parseInt(e.target.value))}
                >
                  <option value={16}>16 points</option>
                  <option value={20}>20 points</option>
                  <option value={24}>24 points</option>
                  <option value={28}>28 points</option>
                  <option value={32}>32 points</option>
                </select>
                <p className="text-sm text-black">
                  Total points to play in each match (e.g., final score might be 15-9)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  Number of Courts Available
                </label>
                <select
                  className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-base text-black transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={formData.numberOfCourts}
                  onChange={(e) => handleInputChange('numberOfCourts', parseInt(e.target.value))}
                >
                  <option value={1}>1 court</option>
                  <option value={2}>2 courts</option>
                  <option value={3}>3 courts</option>
                  <option value={4}>4 courts</option>
                  <option value={5}>5 courts</option>
                  <option value={6}>6 courts</option>
                </select>
                <p className="text-sm text-black">
                  More courts allow multiple matches to run simultaneously
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  Tournament Duration
                </label>
                <select
                  className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-base text-black transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={formData.targetDuration}
                  onChange={(e) => handleInputChange('targetDuration', parseInt(e.target.value))}
                >
                  <option value={90}>90 minutes (1h 30m)</option>
                  <option value={105}>105 minutes (1h 45m)</option>
                  <option value={120}>120 minutes (2h)</option>
                  <option value={135}>135 minutes (2h 15m)</option>
                  <option value={150}>150 minutes (2h 30m)</option>
                </select>
                <p className="text-sm text-black">
                  Tournament will automatically end after reaching the calculated maximum rounds for this duration
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Players */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-primary-500" />
                  <span>Players ({validPlayers.length})</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addPlayer}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Player
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {players.map((player, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Input
                        placeholder={`Player ${index + 1} name...`}
                        value={player}
                        onChange={(e) => updatePlayer(index, e.target.value)}
                      />
                    </div>
                    {players.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayer(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {validPlayers.length < 4 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Note:</strong> You need at least 4 players to create an Americano tournament.
                      Currently you have {validPlayers.length} player{validPlayers.length !== 1 ? 's' : ''}.
                    </p>
                  </div>
                )}

                {validPlayers.length >= 4 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-800 text-sm">
                      <strong>Ready to go!</strong> You have {validPlayers.length} players registered.
                      {validPlayers.length % 4 !== 0 && (
                        ` Note: With ${validPlayers.length} players, some players may sit out certain rounds.`
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href="/tournaments">
              <Button variant="outline" size="lg">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || validPlayers.length < 4 || !formData.name.trim()}
            >
              {isSubmitting ? 'Creating Tournament...' : 'Create Tournament'}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}
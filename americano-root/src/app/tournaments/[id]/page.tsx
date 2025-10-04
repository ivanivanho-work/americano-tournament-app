'use client'

import { useState, useEffect, use } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaderboard } from "@/components/Leaderboard"
import { ScoreEntry } from "@/components/ScoreEntry"
import { AdminPanel } from "@/components/AdminPanel"
import { TournamentProgress } from "@/components/TournamentProgress"
import { RefreshButton } from "@/components/RefreshButton"
import { Footer } from "@/components/Footer"
import { TournamentStorage } from "@/lib/tournament-storage"
import { Trophy, Users, Plus, ArrowLeft, Play, CheckCircle, Clock, Copy } from "lucide-react"
import { AmericanoEngine } from "@/lib/americano"

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [tournament, setTournament] = useState<any>(null)
  const [engine, setEngine] = useState<AmericanoEngine | null>(null)
  const [showScoreEntry, setShowScoreEntry] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState<any>(null)
  const [copiedPlayerAccess, setCopiedPlayerAccess] = useState(false)

  useEffect(() => {
    // Ensure migration is run on every page load for robustness
    TournamentStorage.migrateToV2()

    // Load tournament from storage
    const storedTournament = TournamentStorage.getTournament(resolvedParams.id)

    if (!storedTournament) {
      // Tournament not found
      return
    }

    setTournament(storedTournament)

    // Initialize Americano engine with tournament ID for persistence
    const americanoEngine = new AmericanoEngine(storedTournament.players, storedTournament.numberOfCourts || 1, storedTournament.rounds || [], storedTournament.id)
    setEngine(americanoEngine)

    // Check if tournament needs initial round generation
    if (storedTournament.status === 'ACTIVE' && (!storedTournament.rounds || storedTournament.rounds.length === 0)) {
      const round1 = americanoEngine.generateNextRound()
      if (round1) {
        TournamentStorage.saveRounds(storedTournament.id, [round1], round1.id)
        setCurrentRound(round1)
      }
    } else {
      // Load current round from storage
      const currentRound = TournamentStorage.getCurrentRound(storedTournament.id)
      setCurrentRound(currentRound)

      // If current round is complete, check if we need next round
      if (TournamentStorage.shouldGenerateNextRound(storedTournament.id)) {
        const newRound = americanoEngine.generateNextRound()
        if (newRound) {
          const updatedRounds = [...(storedTournament.rounds || []), newRound]
          TournamentStorage.saveRounds(storedTournament.id, updatedRounds, newRound.id)
          setCurrentRound(newRound)
        }
      }
    }
  }, [resolvedParams.id])

  const handleScoreSubmit = (matchId: string, team1Score: number, team2Score: number) => {
    if (tournament) {
      // Update match score in centralized storage
      const success = TournamentStorage.updateMatchScore(tournament.id, matchId, team1Score, team2Score)

      if (success) {
        setShowScoreEntry(null)

        // Reload tournament data to get updated players and rounds
        const updatedTournament = TournamentStorage.getTournament(tournament.id)
        if (updatedTournament) {
          setTournament(updatedTournament)

          // Check if we need to generate next round
          if (TournamentStorage.shouldGenerateNextRound(tournament.id) && engine) {
            const newRound = engine.generateNextRound()
            if (newRound) {
              const updatedRounds = [...(updatedTournament.rounds || []), newRound]
              TournamentStorage.saveRounds(tournament.id, updatedRounds, newRound.id)
              setCurrentRound(newRound)
            }
          } else {
            // Update current round display
            const currentRound = TournamentStorage.getCurrentRound(tournament.id)
            setCurrentRound(currentRound)
          }
        }
      }
    }
  }

  const generateNextRound = () => {
    if (engine && tournament) {
      const newRound = engine.generateNextRound()
      if (newRound) {
        const updatedRounds = [...(tournament.rounds || []), newRound]
        TournamentStorage.saveRounds(tournament.id, updatedRounds, newRound.id)
        setCurrentRound(newRound)

        // Update tournament state
        const updatedTournament = TournamentStorage.getTournament(tournament.id)
        if (updatedTournament) {
          setTournament(updatedTournament)
        }
      }
    }
  }

  const navigateToRound = (roundId: string) => {
    if (tournament?.rounds) {
      const selectedRound = tournament.rounds.find((r: any) => r.id === roundId)
      if (selectedRound) {
        TournamentStorage.saveRounds(tournament.id, tournament.rounds, roundId)
        setCurrentRound(selectedRound)
      }
    }
  }

  const handleTournamentUpdate = (updatedTournament: any) => {
    setTournament(updatedTournament)

    // Reinitialize engine with updated players and reset tournament
    const americanoEngine = new AmericanoEngine(updatedTournament.players, updatedTournament.numberOfCourts || 1, updatedTournament.rounds || [], updatedTournament.id)

    // Reset the engine to start fresh with the new player list
    americanoEngine.resetWithNewPlayers(updatedTournament.players)

    // Generate first round with updated players
    if (updatedTournament.status === 'ACTIVE' && updatedTournament.players.length >= 4) {
      const round1 = americanoEngine.generateNextRound()
      setCurrentRound(round1)
    } else {
      setCurrentRound(null)
    }

    setEngine(americanoEngine)
  }

  const handleRefresh = () => {
    // Reload tournament data from storage
    const freshTournament = TournamentStorage.getTournament(resolvedParams.id)
    if (freshTournament) {
      handleTournamentUpdate(freshTournament)
    }
  }

  const copyPlayerAccessUrl = async () => {
    try {
      const baseUrl = window.location.origin
      const playerAccessUrl = `${baseUrl}/tournaments/${tournament.id}/players`

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(playerAccessUrl)
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = playerAccessUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      setCopiedPlayerAccess(true)
      setTimeout(() => setCopiedPlayerAccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      alert('Failed to copy URL. Please try again.')
    }
  }

  if (!tournament) {
    return <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tournament...</p>
      </div>
    </div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (showScoreEntry) {
    const match = currentRound?.matches.find((m: any) => m.id === showScoreEntry)
    if (match) {
      const player1 = tournament.players.find((p: any) => p.id === match.player1Id)
      const player2 = tournament.players.find((p: any) => p.id === match.player2Id)
      const player3 = tournament.players.find((p: any) => p.id === match.player3Id)
      const player4 = tournament.players.find((p: any) => p.id === match.player4Id)

      return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-6">
          <div className="max-w-lg mx-auto">
            <div className="mb-6">
              <Button
                onClick={() => setShowScoreEntry(null)}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tournament
              </Button>
            </div>
            <ScoreEntry
              match={{
                id: match.id,
                player1Name: player1?.name || '',
                player2Name: player2?.name || '',
                player3Name: player3?.name || '',
                player4Name: player4?.name || '',
                courtNumber: match.courtNumber,
                team1Score: match.team1Score,
                team2Score: match.team2Score,
              }}
              pointsPerMatch={tournament.pointsPerMatch}
              onScoreSubmit={handleScoreSubmit}
              onCancel={() => setShowScoreEntry(null)}
            />
          </div>
        </div>
      )
    }
  }

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
              <div>
                <h1 className="text-2xl font-bold text-black">{tournament.name}</h1>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                </div>
              </div>
            </div>
          </Link>
          <RefreshButton onRefresh={handleRefresh} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Current Round & Matches */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Round */}
            {currentRound && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span>Round {currentRound.roundNumber}</span>

                      {/* Round Navigation */}
                      {tournament?.rounds && tournament.rounds.length > 1 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Navigate to:</span>
                          <select
                            value={currentRound.id}
                            onChange={(e) => navigateToRound(e.target.value)}
                            className="px-3 py-1 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {tournament.rounds.map((round: any) => (
                              <option key={round.id} value={round.id}>
                                Round {round.roundNumber} ({round.status === 'COMPLETED' ? 'Complete' : 'In Progress'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {currentRound?.status === 'COMPLETED' && tournament.players.length >= 4 && (
                      <Button onClick={generateNextRound} variant="secondary" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Next Round
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentRound.matches.map((match: any) => {
                      const player1 = tournament.players.find((p: any) => p.id === match.player1Id)
                      const player2 = tournament.players.find((p: any) => p.id === match.player2Id)
                      const player3 = tournament.players.find((p: any) => p.id === match.player3Id)
                      const player4 = tournament.players.find((p: any) => p.id === match.player4Id)

                      return (
                        <div key={match.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Court {match.courtNumber}
                              </span>
                              {match.status === 'COMPLETED' && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            {match.team1Score !== undefined && match.team2Score !== undefined && (
                              <div className="text-xl font-bold">
                                {match.team1Score} - {match.team2Score}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Team 1 */}
                            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-3 border-2 border-primary-200">
                              <h4 className="font-bold text-primary-800 mb-2 flex items-center">
                                <span className="bg-primary-500 text-white px-2 py-1 rounded-full text-xs mr-2">1</span>
                                Team 1
                              </h4>
                              <div className="space-y-1">
                                <div className="text-sm text-black font-medium bg-white rounded px-2 py-1">{player1?.name}</div>
                                <div className="text-sm text-black font-medium bg-white rounded px-2 py-1">{player2?.name}</div>
                              </div>
                            </div>

                            {/* Team 2 */}
                            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-lg p-3 border-2 border-accent-200">
                              <h4 className="font-bold text-accent-800 mb-2 flex items-center">
                                <span className="bg-accent-500 text-white px-2 py-1 rounded-full text-xs mr-2">2</span>
                                Team 2
                              </h4>
                              <div className="space-y-1">
                                <div className="text-sm text-black font-medium bg-white rounded px-2 py-1">{player3?.name}</div>
                                <div className="text-sm text-black font-medium bg-white rounded px-2 py-1">{player4?.name}</div>
                              </div>
                            </div>
                          </div>

                          {match.status === 'PENDING' && (
                            <Button
                              onClick={() => setShowScoreEntry(match.id)}
                              variant="primary"
                              size="sm"
                              className="w-full"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Enter Score
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Rounds */}
            {tournament?.rounds && tournament.rounds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tournament History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tournament.rounds.map((round: any) => (
                      <div
                        key={round.id}
                        className={`border-l-4 pl-4 cursor-pointer hover:bg-gray-50 rounded-r-lg p-3 transition-colors ${
                          currentRound?.id === round.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => navigateToRound(round.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-black">Round {round.roundNumber}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              round.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {round.status}
                            </span>
                            {currentRound?.id === round.id && (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Click to view
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {round.matches.length} matches
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Leaderboard */}
          <div className="space-y-6">
            <AdminPanel
              tournament={tournament}
              onTournamentUpdate={handleTournamentUpdate}
            />

            <TournamentProgress
              tournament={tournament}
              currentRound={currentRound}
              engine={engine}
            />

            <Leaderboard players={tournament.players.sort((a: any, b: any) => b.totalPoints - a.totalPoints)} />

            {/* Tournament Info */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Players</span>
                  <span className="font-medium text-black">{tournament.players.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Points per Match</span>
                  <span className="font-medium text-black">{tournament.pointsPerMatch}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Number of Courts</span>
                  <span className="font-medium text-black">{tournament.numberOfCourts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Current Round</span>
                  <span className="font-medium text-black">{currentRound?.roundNumber || 'Not started'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Max Rounds</span>
                  <span className="font-medium text-black">{tournament.maxRounds || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Target Duration</span>
                  <span className="font-medium text-black">{tournament.targetDuration || 105} min</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/tournaments/${tournament.id}/players`}>
                  <Button variant="secondary" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Player Access
                  </Button>
                </Link>
                <Button
                  onClick={copyPlayerAccessUrl}
                  variant={copiedPlayerAccess ? "secondary" : "outline"}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedPlayerAccess ? "Copied!" : "Copy Player Access Link"}
                </Button>
                <p className="text-sm text-gray-600">
                  Share individual URLs with players so they can access their personal tournament view.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
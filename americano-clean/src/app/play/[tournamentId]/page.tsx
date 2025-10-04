'use client'

import { useState, useEffect, use } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaderboard } from "@/components/Leaderboard"
import { ScoreEntry } from "@/components/ScoreEntry"
import { TournamentProgress } from "@/components/TournamentProgress"
import { RefreshButton } from "@/components/RefreshButton"
import { Footer } from "@/components/Footer"
import { TournamentStorage } from "@/lib/tournament-storage"
import { Trophy, Users, ArrowLeft, Play, Clock, MapPin } from "lucide-react"
import { AmericanoEngine } from "@/lib/americano"

export default function PlayerPage({ params, searchParams }: {
  params: Promise<{ tournamentId: string }>,
  searchParams: Promise<{ player?: string }>
}) {
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  const [tournament, setTournament] = useState<any>(null)
  const [engine, setEngine] = useState<AmericanoEngine | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<any>(null)
  const [playerMatches, setPlayerMatches] = useState<any[]>([])
  const [showScoreEntry, setShowScoreEntry] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState<any>(null)

  useEffect(() => {
    // Load tournament from storage
    const storedTournament = TournamentStorage.getTournament(resolvedParams.tournamentId)

    if (!storedTournament) {
      return
    }

    setTournament(storedTournament)

    // Find the current player
    const playerName = resolvedSearchParams.player
    if (!playerName) {
      return
    }

    const player = storedTournament.players.find(p =>
      p.name.toLowerCase().replace(/\s+/g, '-') === playerName.toLowerCase()
    )

    if (!player) {
      return
    }

    setCurrentPlayer(player)

    // Initialize Americano engine for utility functions only
    const americanoEngine = new AmericanoEngine(storedTournament.players, storedTournament.numberOfCourts || 1, storedTournament.rounds || [], storedTournament.id)
    setEngine(americanoEngine)

    // Get current round from centralized storage
    const currentRound = TournamentStorage.getCurrentRound(storedTournament.id)
    if (currentRound) {
      setCurrentRound(currentRound)
      const playerRoundMatches = currentRound.matches.filter((match: any) =>
        match.player1Id === player.id ||
        match.player2Id === player.id ||
        match.player3Id === player.id ||
        match.player4Id === player.id
      )
      setPlayerMatches(playerRoundMatches)
    } else if (storedTournament.status === 'ACTIVE' && (!storedTournament.rounds || storedTournament.rounds.length === 0)) {
      // Generate first round if tournament is active but no rounds exist
      const round1 = americanoEngine.generateNextRound()
      if (round1) {
        console.log(`Generated round with ${round1.matches.length} matches for ${storedTournament.players.length} players on ${storedTournament.numberOfCourts || 1} courts`)
        TournamentStorage.saveRounds(storedTournament.id, [round1], round1.id)
        setCurrentRound(round1)
        const playerRoundMatches = round1.matches.filter(match =>
          match.player1Id === player.id ||
          match.player2Id === player.id ||
          match.player3Id === player.id ||
          match.player4Id === player.id
        )
        setPlayerMatches(playerRoundMatches)
      }
    }
  }, [resolvedParams.tournamentId, resolvedSearchParams.player])

  const handleScoreSubmit = (matchId: string, team1Score: number, team2Score: number) => {
    if (tournament && currentPlayer) {
      // Update match score in centralized storage
      const success = TournamentStorage.updateMatchScore(tournament.id, matchId, team1Score, team2Score)

      if (success) {
        setShowScoreEntry(null)

        // Reload tournament data to get updated players and rounds
        const updatedTournament = TournamentStorage.getTournament(tournament.id)
        if (updatedTournament) {
          setTournament(updatedTournament)

          // Update current player data
          const updatedPlayer = updatedTournament.players.find(p => p.id === currentPlayer.id)
          if (updatedPlayer) {
            setCurrentPlayer(updatedPlayer)
          }

          // Check if we need to generate next round
          if (TournamentStorage.shouldGenerateNextRound(tournament.id) && engine) {
            const newRound = engine.generateNextRound()
            if (newRound) {
              const updatedRounds = [...(updatedTournament.rounds || []), newRound]
              TournamentStorage.saveRounds(tournament.id, updatedRounds, newRound.id)
              setCurrentRound(newRound)

              // Update player matches for the new round
              const playerRoundMatches = newRound.matches.filter(match =>
                match.player1Id === currentPlayer.id ||
                match.player2Id === currentPlayer.id ||
                match.player3Id === currentPlayer.id ||
                match.player4Id === currentPlayer.id
              )
              setPlayerMatches(playerRoundMatches)
            }
          } else {
            // Update current round and player matches
            const currentRound = TournamentStorage.getCurrentRound(tournament.id)
            setCurrentRound(currentRound)
            if (currentRound) {
              const playerRoundMatches = currentRound.matches.filter((match: any) =>
                match.player1Id === currentPlayer.id ||
                match.player2Id === currentPlayer.id ||
                match.player3Id === currentPlayer.id ||
                match.player4Id === currentPlayer.id
              )
              setPlayerMatches(playerRoundMatches)
            }
          }
        }
      }
    }
  }

  const handleRefresh = () => {
    // Reload tournament data from centralized storage
    const storedTournament = TournamentStorage.getTournament(resolvedParams.tournamentId)
    if (storedTournament && currentPlayer) {
      setTournament(storedTournament)

      // Update current player data
      const updatedPlayer = storedTournament.players.find(p => p.id === currentPlayer.id)
      if (updatedPlayer) {
        setCurrentPlayer(updatedPlayer)
      }

      // Get current round from storage
      const currentRound = TournamentStorage.getCurrentRound(storedTournament.id)
      if (currentRound) {
        setCurrentRound(currentRound)
        const playerRoundMatches = currentRound.matches.filter((match: any) =>
          match.player1Id === currentPlayer.id ||
          match.player2Id === currentPlayer.id ||
          match.player3Id === currentPlayer.id ||
          match.player4Id === currentPlayer.id
        )
        setPlayerMatches(playerRoundMatches)
      }

      // Reinitialize engine for utility functions
      const americanoEngine = new AmericanoEngine(storedTournament.players, storedTournament.numberOfCourts || 1, storedTournament.rounds || [], storedTournament.id)
      setEngine(americanoEngine)
    }
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black">Loading tournament...</p>
        </div>
      </div>
    )
  }

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Player Not Found</h2>
          <p className="text-gray-700 mb-4">
            The player "{resolvedSearchParams.player}" was not found in this tournament.
          </p>
          <Link href={`/tournaments/${resolvedParams.tournamentId}`}>
            <Button variant="primary">
              View Tournament
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (showScoreEntry) {
    const match = playerMatches.find(m => m.id === showScoreEntry)
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
                Back to My Matches
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
      <header className="p-4 md:p-6 border-b border-white/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-black truncate">{tournament.name}</h1>
              <p className="text-xs md:text-sm text-gray-700 truncate">Playing as {currentPlayer.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <RefreshButton onRefresh={handleRefresh} iconOnly />
            <Link href={`/tournaments/${resolvedParams.tournamentId}`}>
              <Button variant="outline" size="sm" className="text-xs md:text-sm">
                <span className="hidden sm:inline">Tournament View</span>
                <span className="sm:hidden">View</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - My Matches */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="w-6 h-6 text-primary-500" />
                  <span>My Matches - Round {currentRound?.roundNumber || 1}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {playerMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">No matches scheduled yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {playerMatches.map((match) => {
                      const player1 = tournament.players.find((p: any) => p.id === match.player1Id)
                      const player2 = tournament.players.find((p: any) => p.id === match.player2Id)
                      const player3 = tournament.players.find((p: any) => p.id === match.player3Id)
                      const player4 = tournament.players.find((p: any) => p.id === match.player4Id)

                      const isOnTeam1 = match.player1Id === currentPlayer.id || match.player2Id === currentPlayer.id
                      const myTeammate = isOnTeam1
                        ? (match.player1Id === currentPlayer.id ? player2 : player1)
                        : (match.player3Id === currentPlayer.id ? player4 : player3)

                      const opponents = isOnTeam1
                        ? [player3, player4]
                        : [player1, player2]

                      return (
                        <div key={match.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Court {match.courtNumber}
                              </span>
                            </div>
                            {match.team1Score !== undefined && match.team2Score !== undefined && (
                              <div className="text-xl font-bold text-black">
                                {match.team1Score} - {match.team2Score}
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                              <h4 className="font-semibold text-black mb-2">Your Team</h4>
                              <div className="space-y-1">
                                <div className="text-sm text-black font-medium">• {currentPlayer.name} (You)</div>
                                <div className="text-sm text-black font-medium">• {myTeammate?.name}</div>
                              </div>
                            </div>

                            <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-500">
                              <h4 className="font-semibold text-black mb-2">Opponents</h4>
                              <div className="space-y-1">
                                <div className="text-sm text-black font-medium">• {opponents[0]?.name}</div>
                                <div className="text-sm text-black font-medium">• {opponents[1]?.name}</div>
                              </div>
                            </div>
                          </div>

                          {match.status === 'PENDING' && (
                            <div className="mt-4">
                              <Button
                                onClick={() => setShowScoreEntry(match.id)}
                                variant="primary"
                                size="lg"
                                className="w-full"
                              >
                                <Play className="w-5 h-5 mr-2" />
                                Enter Score for This Match
                              </Button>
                            </div>
                          )}

                          {match.status === 'COMPLETED' && (
                            <div className="mt-4 text-center">
                              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                                ✓ Match Completed
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="space-y-6">
            <TournamentProgress
              tournament={tournament}
              currentRound={currentRound}
              engine={engine}
            />

            <Leaderboard players={tournament.players} />

            {/* Player Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Current Points</span>
                  <span className="font-bold text-2xl text-primary-600">{currentPlayer.totalPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Matches Played</span>
                  <span className="font-medium text-black">
                    {playerMatches.filter(m => m.status === 'COMPLETED').length} / {playerMatches.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Position</span>
                  <span className="font-medium text-black">
                    #{tournament.players.sort((a: any, b: any) => b.totalPoints - a.totalPoints).findIndex((p: any) => p.id === currentPlayer.id) + 1}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
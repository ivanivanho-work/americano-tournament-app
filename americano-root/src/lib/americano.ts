export interface Player {
  id: string
  name: string
  totalPoints: number
}

export interface Match {
  id: string
  player1Id: string
  player2Id: string
  player3Id: string
  player4Id: string
  team1Score?: number
  team2Score?: number
  courtNumber?: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
}

export interface Round {
  id: string
  roundNumber: number
  matches: Match[]
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
}

export interface PairingHistory {
  [playerId: string]: Set<string>
}

export class AmericanoEngine {
  private players: Player[]
  private rounds: Round[]
  private numberOfCourts: number
  private tournamentId: string

  constructor(players: Player[], numberOfCourts: number = 1, existingRounds: Round[] = [], tournamentId: string = '') {
    this.players = players
    this.numberOfCourts = numberOfCourts
    this.rounds = existingRounds
    this.tournamentId = tournamentId

    // Trigger migration on engine creation (handles browser refreshes)
    if (typeof window !== 'undefined' && tournamentId) {
      const { TournamentStorage } = require('./tournament-storage')
      TournamentStorage.migrateToV2()
    }
  }

  private getPersistentAmericanoState(): any {
    if (!this.tournamentId) return null
    const { TournamentStorage } = require('./tournament-storage')
    return TournamentStorage.getAmericanoState(this.tournamentId)
  }

  private savePersistentAmericanoState(state: any): void {
    if (!this.tournamentId) return
    const { TournamentStorage } = require('./tournament-storage')
    TournamentStorage.saveAmericanoState(this.tournamentId, state)
  }

  private getPartnershipCount(player1Id: string, player2Id: string): number {
    const state = this.getPersistentAmericanoState()
    if (!state || !state.partnershipCounts) return 0
    return state.partnershipCounts[player1Id]?.[player2Id] || 0
  }

  private hasBeenPartners(player1Id: string, player2Id: string): boolean {
    const state = this.getPersistentAmericanoState()
    if (!state || !state.pairingHistory) return false
    return state.pairingHistory[player1Id]?.includes(player2Id) || false
  }

  private getPlayerCourtHistory(playerId: string): number[] {
    const state = this.getPersistentAmericanoState()
    if (!state || !state.playerCourtHistory) return []
    return state.playerCourtHistory[playerId] || []
  }

  private getCourtDiversityScore(playerIds: string[], courtNumber: number): number {
    // Calculate how many of these players have played on this court before
    // Lower score = better (fewer players have been on this court)
    let playersOnThisCourt = 0

    playerIds.forEach(playerId => {
      const courtHistory = this.getPlayerCourtHistory(playerId)
      if (courtHistory.includes(courtNumber)) {
        playersOnThisCourt++
      }
    })

    return playersOnThisCourt
  }

  private recordNewPairings(matches: Array<{ players: [string, string, string, string] }>): void {
    if (!this.tournamentId) return

    const { TournamentStorage } = require('./tournament-storage')
    TournamentStorage.updatePairingTracking(this.tournamentId, matches)
  }

  private hasPlayedAgainstTeam(playerId: string, opponentTeam: [string, string]): boolean {
    const state = this.getPersistentAmericanoState()
    if (!state || !state.opponentPairHistory) return false

    const teamKey = opponentTeam.sort().join('+')
    return state.opponentPairHistory[playerId]?.includes(teamKey) || false
  }

  private getOpponentPairScore(team1: [string, string], team2: [string, string]): number {
    // Count how many players have faced this exact opponent team before
    let score = 0

    if (this.hasPlayedAgainstTeam(team1[0], team2)) score++
    if (this.hasPlayedAgainstTeam(team1[1], team2)) score++
    if (this.hasPlayedAgainstTeam(team2[0], team1)) score++
    if (this.hasPlayedAgainstTeam(team2[1], team1)) score++

    return score
  }

  private getMatchGroupScore(fourPlayers: string[]): number {
    const state = this.getPersistentAmericanoState()
    if (!state || !state.matchGroupHistory) return 0

    const groupKey = fourPlayers.sort().join('+')
    return state.matchGroupHistory[groupKey] || 0
  }

  private hasGroupBeenUsed(fourPlayers: string[]): boolean {
    const state = this.getPersistentAmericanoState()
    if (!state || !state.matchGroupHistory) {
      return false
    }

    const groupKey = fourPlayers.sort().join('+')
    const timesUsed = state.matchGroupHistory[groupKey] || 0

    return timesUsed > 0
  }

  private getAllPossibleMatches(): Array<{
    players: [string, string, string, string]
    partnershipScore: number
    opponentScore: number
    totalScore: number
    isRepeatedGroup: boolean
  }> {
    const matches: Array<{
      players: [string, string, string, string]
      partnershipScore: number
      opponentScore: number
      totalScore: number
      isRepeatedGroup: boolean
    }> = []

    const playerIds = this.players.map(p => p.id)

    // Generate all possible combinations of 4 players
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        for (let k = j + 1; k < playerIds.length; k++) {
          for (let l = k + 1; l < playerIds.length; l++) {
            const fourPlayers = [playerIds[i], playerIds[j], playerIds[k], playerIds[l]]

            // EXPLICIT CHECK: Has this exact 4-player group been used before?
            const isRepeatedGroup = this.hasGroupBeenUsed(fourPlayers)

            // Generate all possible team pairings for these 4 players
            const teamPairings = [
              [[fourPlayers[0], fourPlayers[1]], [fourPlayers[2], fourPlayers[3]]],
              [[fourPlayers[0], fourPlayers[2]], [fourPlayers[1], fourPlayers[3]]],
              [[fourPlayers[0], fourPlayers[3]], [fourPlayers[1], fourPlayers[2]]]
            ]

            // Choose the pairing with the best partnership/opponent score
            let bestPairing = teamPairings[0]
            let bestScore = Infinity

            for (const pairing of teamPairings) {
              const team1: [string, string] = [pairing[0][0], pairing[0][1]]
              const team2: [string, string] = [pairing[1][0], pairing[1][1]]

              // Partnership score (lower = better)
              const partnershipScore = this.getPartnershipCount(team1[0], team1[1]) +
                                     this.getPartnershipCount(team2[0], team2[1])

              // Opponent pair score (lower = better)
              const opponentScore = this.getOpponentPairScore(team1, team2)

              const combinedScore = (partnershipScore * 10) + (opponentScore * 5)

              if (combinedScore < bestScore) {
                bestScore = combinedScore
                bestPairing = pairing
              }
            }

            const finalPartnershipScore = this.getPartnershipCount(bestPairing[0][0], bestPairing[0][1]) +
                                         this.getPartnershipCount(bestPairing[1][0], bestPairing[1][1])
            const finalOpponentScore = this.getOpponentPairScore([bestPairing[0][0], bestPairing[0][1]], [bestPairing[1][0], bestPairing[1][1]])

            matches.push({
              players: [bestPairing[0][0], bestPairing[0][1], bestPairing[1][0], bestPairing[1][1]],
              partnershipScore: finalPartnershipScore,
              opponentScore: finalOpponentScore,
              totalScore: bestScore,
              isRepeatedGroup: isRepeatedGroup
            })
          }
        }
      }
    }

    return matches
  }

  private selectOptimalMatchesWithCourts(
    allMatches: Array<{ players: [string, string, string, string]; partnershipScore: number; opponentScore: number; totalScore: number; isRepeatedGroup: boolean }>,
    maxMatches: number
  ): Array<{ players: [string, string, string, string]; partnershipScore: number; opponentScore: number; totalScore: number; isRepeatedGroup: boolean; courtNumber: number }> {

    // STEP 1: EXPLICIT FILTERING - Remove ALL repeated groups first
    const newGroupMatches = allMatches.filter(match => !match.isRepeatedGroup)
    const repeatedGroupMatches = allMatches.filter(match => match.isRepeatedGroup)

    // STEP 2: Sort new groups by quality (partnerships, opponents, etc.)
    const sortedNewGroups = [...newGroupMatches].sort((a, b) => a.totalScore - b.totalScore)

    // STEP 3: Sort repeated groups as fallback (should only be used if no new groups available)
    const sortedRepeatedGroups = [...repeatedGroupMatches].sort((a, b) => a.totalScore - b.totalScore)

    // STEP 4: Prioritize new groups, then fall back to repeated groups only if necessary
    const prioritizedMatches = [...sortedNewGroups, ...sortedRepeatedGroups]

    const selectedMatches: Array<{ players: [string, string, string, string]; partnershipScore: number; opponentScore: number; totalScore: number; isRepeatedGroup: boolean; courtNumber: number }> = []
    const usedPlayers = new Set<string>()

    // STEP 5: Select matches with explicit preference for new groups
    for (const match of prioritizedMatches) {
      if (selectedMatches.length >= maxMatches) {
        break
      }

      // Check if any player in this match is already used
      const hasOverlap = match.players.some(playerId => usedPlayers.has(playerId))

      if (!hasOverlap) {
        // Find the best court for this match (maximize court diversity)
        let bestCourt = 1
        let bestCourtScore = Infinity

        for (let court = 1; court <= this.numberOfCourts; court++) {
          // Check if this court is already assigned in this round
          const courtAlreadyUsed = selectedMatches.some(m => m.courtNumber === court)
          if (courtAlreadyUsed) continue

          // Calculate court diversity score for this match on this court
          const courtScore = this.getCourtDiversityScore(match.players, court)

          if (courtScore < bestCourtScore) {
            bestCourtScore = courtScore
            bestCourt = court
          }
        }

        selectedMatches.push({
          ...match,
          courtNumber: bestCourt
        })

        // Mark all players in this match as used
        match.players.forEach(playerId => usedPlayers.add(playerId))
      }
    }

    return selectedMatches
  }

  public generateNextRound(): Round | null {
    const playerIds = this.players.map(p => p.id)
    const roundNumber = this.rounds.length + 1

    if (playerIds.length < 4) {
      return null // Not enough players
    }

    // Calculate how many matches we can create based on players and courts
    const maxPossibleMatches = Math.floor(playerIds.length / 4)
    const actualMatches = Math.min(maxPossibleMatches, this.numberOfCourts)

    if (actualMatches === 0) {
      return null // No courts available
    }

    // Get all possible match combinations with partnership scoring
    const allPossibleMatches = this.getAllPossibleMatches()

    if (allPossibleMatches.length === 0) {
      return null // No valid matches possible
    }

    // Use enhanced algorithm to select best non-overlapping matches with optimal court assignments
    const selectedMatches = this.selectOptimalMatchesWithCourts(allPossibleMatches, actualMatches)

    if (selectedMatches.length === 0) {
      return null // Couldn't find any valid match combinations
    }

    // Note: Some players may sit out if total players don't divide evenly by courts*4

    // Create match objects
    const roundMatches: Match[] = []

    for (let i = 0; i < selectedMatches.length; i++) {
      const selectedMatch = selectedMatches[i]
      const match: Match = {
        id: `round-${roundNumber}-match-${i + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        player1Id: selectedMatch.players[0],
        player2Id: selectedMatch.players[1],
        player3Id: selectedMatch.players[2],
        player4Id: selectedMatch.players[3],
        courtNumber: selectedMatch.courtNumber, // Use optimized court assignment
        status: 'PENDING'
      }
      roundMatches.push(match)
    }

    // Record new pairings to persistent storage IMMEDIATELY
    this.recordNewPairings(selectedMatches)

    // Update player participation and court tracking
    if (this.tournamentId) {
      const matchesWithCourts = selectedMatches.map(match => ({
        players: match.players,
        courtNumber: match.courtNumber
      }))
      const { TournamentStorage } = require('./tournament-storage')
      TournamentStorage.updatePlayerParticipation(this.tournamentId, roundNumber, matchesWithCourts)
    }

    const round: Round = {
      id: `round-${roundNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roundNumber,
      matches: roundMatches,
      status: 'PENDING'
    }

    this.rounds.push(round)
    return round
  }

  // This method is now handled entirely by TournamentStorage.updateMatchScore()
  // Keeping for backward compatibility but redirecting to storage layer
  public updateMatchScore(matchId: string, team1Score: number, team2Score: number): void {
    if (!this.tournamentId) return

    const { TournamentStorage } = require('./tournament-storage')
    TournamentStorage.updateMatchScore(this.tournamentId, matchId, team1Score, team2Score)
    TournamentStorage.logAdminAction(this.tournamentId, 'MATCH_COMPLETED', {
      matchId,
      scores: { team1Score, team2Score }
    })
  }

  public getLeaderboard(): Player[] {
    return [...this.players].sort((a, b) => b.totalPoints - a.totalPoints)
  }

  public getCurrentRound(): Round | null {
    return this.rounds.find(round => round.status !== 'COMPLETED') || null
  }

  public getAllRounds(): Round[] {
    return this.rounds
  }

  public canGenerateNextRound(): boolean {
    // Check if current round is completed
    const currentRound = this.getCurrentRound()
    if (currentRound && currentRound.matches.some(match => match.status !== 'COMPLETED')) {
      return false
    }

    // Check if we have enough players for at least one more match
    if (this.players.length < 4) {
      return false
    }

    // Check if we've reached the maximum number of rounds set by admin
    if (this.tournamentId) {
      const { TournamentStorage } = require('./tournament-storage')
      const tournament = TournamentStorage.getTournament(this.tournamentId)
      if (tournament && tournament.maxRounds) {
        const completedRounds = this.rounds.filter(round => round.status === 'COMPLETED').length
        if (completedRounds >= tournament.maxRounds) {
          return false
        }
      }
    }

    return true
  }

  // Admin function: Reset tournament with new player list
  public resetWithNewPlayers(newPlayers: Player[]): void {
    this.players = newPlayers
    this.rounds = []

    // Reset persistent Americano state for new players
    if (this.tournamentId) {
      const { TournamentStorage } = require('./tournament-storage')

      const resetState = {
        pairingHistory: newPlayers.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: string[] }),
        partnershipCounts: newPlayers.reduce((acc, player) => {
          acc[player.id] = {}
          return acc
        }, {} as { [playerId: string]: { [partnerId: string]: number } }),
        opponentHistory: newPlayers.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: string[] }),
        opponentPairHistory: newPlayers.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: string[] }),
        playerRoundParticipation: newPlayers.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: number[] }),
        playerCourtHistory: newPlayers.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: number[] }),
        courtUsageByRound: {},
        matchGroupHistory: {},
        playerMatchGroupHistory: newPlayers.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: string[] }),
        totalRoundsGenerated: 0,
        algorithmVersion: '3.0.0'
      }

      TournamentStorage.saveAmericanoState(this.tournamentId, resetState)
      TournamentStorage.logAdminAction(this.tournamentId, 'PLAYER_ADDED', {
        message: 'Tournament reset with new players',
        newPlayerCount: newPlayers.length
      })
    }
  }

  // Check if we should automatically generate the next round
  public shouldAutoGenerateNextRound(): boolean {
    const currentRound = this.getCurrentRound()

    // If there's no current round or it's not completed, don't auto-generate
    if (!currentRound || currentRound.status !== 'COMPLETED') {
      return false
    }

    // Check if we can generate another round
    return this.canGenerateNextRound()
  }
}
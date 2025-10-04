export interface StoredTournament {
  id: string
  name: string
  description: string
  pointsPerMatch: number
  numberOfCourts: number
  targetDuration: number // in minutes (90-120 mins typical)
  maxRounds: number // calculated max rounds based on duration and player mixing
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED'
  players: Array<{
    id: string
    name: string
    totalPoints: number
  }>
  rounds?: Array<{
    id: string
    roundNumber: number
    matches: Array<{
      id: string
      player1Id: string
      player2Id: string
      player3Id: string
      player4Id: string
      team1Score?: number
      team2Score?: number
      courtNumber?: number
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
    }>
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  }>
  currentRoundId?: string
  createdAt: string
  lastUpdated: string

  // Complete Americano Algorithm State - Critical for proper rotation
  americanoState: {
    pairingHistory: { [playerId: string]: string[] } // Who has been partners with whom
    partnershipCounts: { [playerId: string]: { [partnerId: string]: number } } // How many times partners
    opponentHistory: { [playerId: string]: string[] } // Who has played against whom
    opponentPairHistory: { [playerId: string]: string[] } // Specific opponent pairs (e.g., "player2+player3")
    playerRoundParticipation: { [playerId: string]: number[] } // Which rounds each player participated
    playerCourtHistory: { [playerId: string]: number[] } // Which courts each player has played on
    courtUsageByRound: { [roundNumber: number]: { [courtNumber: number]: string[] } } // Track court assignments per round
    matchGroupHistory: { [groupKey: string]: number } // Track which 4-player groups have played together (key: "p1+p2+p3+p4")
    playerMatchGroupHistory: { [playerId: string]: string[] } // Track which 4-player groups each player has been in
    totalRoundsGenerated: number // Total rounds created (including incomplete)
    algorithmVersion: string // For future algorithm updates/migrations
  }

  // Administrative History for Audit Trail
  adminHistory?: Array<{
    timestamp: string
    action: 'PLAYER_ADDED' | 'PLAYER_REMOVED' | 'SCORE_ADJUSTED' | 'TOURNAMENT_SETTING_CHANGED' | 'ROUND_GENERATED' | 'MATCH_COMPLETED'
    details: any
    userId?: string // If we add user authentication later
  }>

  // Performance & Recovery Metadata
  metadata: {
    tournamentVersion: string // For schema migrations
    lastEngineRecreation: string // Track when engine was last rebuilt
    persistenceChecksum?: string // For data integrity verification
    backupCreatedAt?: string // For disaster recovery
  }
}

const STORAGE_KEY = 'americano_tournaments'

export const TournamentStorage = {
  // Get all tournaments
  getAllTournaments(): StoredTournament[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  // Get tournament by ID
  getTournament(id: string): StoredTournament | null {
    const tournaments = this.getAllTournaments()
    return tournaments.find(t => t.id === id) || null
  },

  // Save tournament
  saveTournament(tournament: StoredTournament): void {
    if (typeof window === 'undefined') return

    const tournaments = this.getAllTournaments()
    const existingIndex = tournaments.findIndex(t => t.id === tournament.id)

    if (existingIndex >= 0) {
      tournaments[existingIndex] = tournament
    } else {
      tournaments.push(tournament)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments))
  },

  // Create new tournament
  createTournament(data: {
    name: string
    description: string
    pointsPerMatch: number
    numberOfCourts: number
    playerNames: string[]
    targetDuration?: number
  }): string {
    const id = `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Import here to avoid circular dependency
    const { calculateTournamentStats } = require('./tournament-calculator')

    const targetDuration = data.targetDuration || 105 // Default 105 minutes (1h 45min)
    const stats = calculateTournamentStats(data.playerNames.length, data.numberOfCourts, data.pointsPerMatch, targetDuration)

    const players = data.playerNames.map((name, index) => ({
      id: `player_${index + 1}`,
      name: name.trim(),
      totalPoints: 0
    }))

    const now = new Date().toISOString()

    const tournament: StoredTournament = {
      id,
      name: data.name,
      description: data.description,
      pointsPerMatch: data.pointsPerMatch,
      numberOfCourts: data.numberOfCourts,
      targetDuration,
      maxRounds: stats.totalRounds,
      status: 'ACTIVE',
      players,
      createdAt: now,
      lastUpdated: now,

      // Initialize complete Americano algorithm state
      americanoState: {
        pairingHistory: players.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: string[] }),
        partnershipCounts: players.reduce((acc, player) => {
          acc[player.id] = {}
          return acc
        }, {} as { [playerId: string]: { [partnerId: string]: number } }),
        opponentHistory: players.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: string[] }),
        opponentPairHistory: players.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: string[] }),
        playerRoundParticipation: players.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: number[] }),
        playerCourtHistory: players.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: number[] }),
        courtUsageByRound: {},
        matchGroupHistory: {},
        playerMatchGroupHistory: players.reduce((acc, player) => {
          acc[player.id] = []
          return acc
        }, {} as { [playerId: string]: string[] }),
        totalRoundsGenerated: 0,
        algorithmVersion: '3.0.0'
      },

      // Initialize admin history
      adminHistory: [{
        timestamp: now,
        action: 'TOURNAMENT_SETTING_CHANGED',
        details: {
          action: 'TOURNAMENT_CREATED',
          players: data.playerNames,
          settings: {
            pointsPerMatch: data.pointsPerMatch,
            numberOfCourts: data.numberOfCourts,
            targetDuration
          }
        }
      }],

      // Initialize metadata
      metadata: {
        tournamentVersion: '2.0.0',
        lastEngineRecreation: now,
        persistenceChecksum: this.generateChecksum({ players, rounds: [] })
      }
    }

    this.saveTournament(tournament)
    this.logAdminAction(id, 'TOURNAMENT_SETTING_CHANGED', { message: 'Tournament created' })
    return id
  },

  // Update tournament
  updateTournament(id: string, updates: Partial<StoredTournament>): void {
    const tournament = this.getTournament(id)
    if (tournament) {
      const updated = { ...tournament, ...updates }
      this.saveTournament(updated)
    }
  },


  // Migration: Fix tournaments missing numberOfCourts and add new duration fields
  migrateTournaments(): void {
    if (typeof window === 'undefined') return

    const tournaments = this.getAllTournaments()
    let migrated = false

    // Import here to avoid circular dependency
    const { calculateTournamentStats } = require('./tournament-calculator')

    const migratedTournaments = tournaments.map(tournament => {
      let updatedTournament = { ...tournament }

      // Migrate missing numberOfCourts
      if (tournament.numberOfCourts === undefined || tournament.numberOfCourts === null) {
        console.log(`Migrating tournament ${tournament.id}: adding numberOfCourts = 1`)
        updatedTournament.numberOfCourts = 1
        migrated = true
      }

      // Migrate missing targetDuration and maxRounds
      if (tournament.targetDuration === undefined || tournament.maxRounds === undefined) {
        const targetDuration = 105 // Default 105 minutes
        const stats = calculateTournamentStats(
          tournament.players.length,
          updatedTournament.numberOfCourts,
          tournament.pointsPerMatch,
          targetDuration
        )

        console.log(`Migrating tournament ${tournament.id}: adding targetDuration = ${targetDuration}, maxRounds = ${stats.totalRounds}`)
        updatedTournament.targetDuration = targetDuration
        updatedTournament.maxRounds = stats.totalRounds
        migrated = true
      }

      return updatedTournament
    })

    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedTournaments))
      console.log('Tournament migration completed')
    }
  },

  // Admin: Add player to existing tournament
  addPlayer(tournamentId: string, playerName: string): void {
    const tournament = this.getTournament(tournamentId)
    if (!tournament) return

    const newPlayerId = `player_${tournament.players.length + 1}`
    const newPlayer = {
      id: newPlayerId,
      name: playerName.trim(),
      totalPoints: 0
    }

    tournament.players.push(newPlayer)
    this.saveTournament(tournament)
  },

  // Admin: Remove player from tournament
  removePlayer(tournamentId: string, playerId: string): void {
    const tournament = this.getTournament(tournamentId)
    if (!tournament) return

    tournament.players = tournament.players.filter(p => p.id !== playerId)
    this.saveTournament(tournament)
  },

  // Admin: Update player score directly
  updatePlayerScore(tournamentId: string, playerId: string, newScore: number): void {
    const tournament = this.getTournament(tournamentId)
    if (!tournament) return

    const player = tournament.players.find(p => p.id === playerId)
    if (player) {
      player.totalPoints = newScore
      this.saveTournament(tournament)
    }
  },

  // Save rounds data to tournament
  saveRounds(tournamentId: string, rounds: any[], currentRoundId?: string): void {
    const tournament = this.getTournament(tournamentId)
    if (tournament) {
      tournament.rounds = rounds
      tournament.currentRoundId = currentRoundId
      this.saveTournament(tournament)
    }
  },

  // Update match score and players' points
  updateMatchScore(tournamentId: string, matchId: string, team1Score: number, team2Score: number): boolean {
    const tournament = this.getTournament(tournamentId)
    if (!tournament || !tournament.rounds) return false

    let matchFound = false
    let playersToUpdate: string[] = []

    // Find the match in rounds and update it
    for (const round of tournament.rounds) {
      const match = round.matches.find(m => m.id === matchId)
      if (match && match.status === 'PENDING') {
        match.team1Score = team1Score
        match.team2Score = team2Score
        match.status = 'COMPLETED'
        playersToUpdate = [match.player1Id, match.player2Id, match.player3Id, match.player4Id]
        matchFound = true

        // Check if all matches in this round are completed
        if (round.matches.every(m => m.status === 'COMPLETED')) {
          round.status = 'COMPLETED'
        }
        break
      }
    }

    if (!matchFound) return false

    // Update player scores
    const player1 = tournament.players.find(p => p.id === playersToUpdate[0])
    const player2 = tournament.players.find(p => p.id === playersToUpdate[1])
    const player3 = tournament.players.find(p => p.id === playersToUpdate[2])
    const player4 = tournament.players.find(p => p.id === playersToUpdate[3])

    if (player1 && player2 && player3 && player4) {
      // Team 1 (player1 & player2) gets team1Score points each
      player1.totalPoints += team1Score
      player2.totalPoints += team1Score

      // Team 2 (player3 & player4) gets team2Score points each
      player3.totalPoints += team2Score
      player4.totalPoints += team2Score
    }

    this.saveTournament(tournament)
    return true
  },

  // Get current round for tournament
  getCurrentRound(tournamentId: string): any | null {
    const tournament = this.getTournament(tournamentId)
    if (!tournament || !tournament.rounds) return null

    if (tournament.currentRoundId) {
      return tournament.rounds.find(r => r.id === tournament.currentRoundId) || null
    }

    // Fallback: find first non-completed round
    return tournament.rounds.find(r => r.status !== 'COMPLETED') || null
  },

  // Check if tournament needs new round
  shouldGenerateNextRound(tournamentId: string): boolean {
    const tournament = this.getTournament(tournamentId)
    if (!tournament || !tournament.rounds) return false

    // Check if tournament has reached maximum rounds
    const completedRounds = (tournament.rounds || []).filter(r => r.status === 'COMPLETED').length
    if (completedRounds >= (tournament.maxRounds || 8)) {
      console.log(`Tournament ${tournamentId} has reached maximum rounds (${tournament.maxRounds || 8})`)
      // Auto-complete tournament if not already completed
      if (tournament.status !== 'COMPLETED') {
        this.updateTournament(tournamentId, { status: 'COMPLETED' })
      }
      return false
    }

    const currentRound = this.getCurrentRound(tournamentId)
    if (!currentRound) return tournament.players.length >= 4

    // Check if current round is completed
    return currentRound.status === 'COMPLETED' && tournament.players.length >= 4
  },

  // Delete tournament
  deleteTournament(tournamentId: string): boolean {
    if (typeof window === 'undefined') return false

    try {
      const tournaments = this.getAllTournaments()
      const filteredTournaments = tournaments.filter(t => t.id !== tournamentId)

      if (filteredTournaments.length === tournaments.length) {
        return false // Tournament not found
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTournaments))
      return true
    } catch (error) {
      console.error('Error deleting tournament:', error)
      return false
    }
  },

  // === NEW PERSISTENT AMERICANO STATE METHODS ===

  // Save complete Americano algorithm state
  saveAmericanoState(tournamentId: string, americanoState: any): void {
    const tournament = this.getTournament(tournamentId)
    if (!tournament) return

    tournament.americanoState = americanoState
    tournament.lastUpdated = new Date().toISOString()
    tournament.metadata.lastEngineRecreation = new Date().toISOString()

    this.saveTournament(tournament)
    this.logAdminAction(tournamentId, 'ROUND_GENERATED', { message: 'Americano state updated' })
  },

  // Get Americano state for engine initialization
  getAmericanoState(tournamentId: string): any | null {
    const tournament = this.getTournament(tournamentId)
    return tournament?.americanoState || null
  },

  // Update player participation and court assignments after round generation
  updatePlayerParticipation(tournamentId: string, roundNumber: number, matches: Array<{players: string[], courtNumber: number}>): void {
    const tournament = this.getTournament(tournamentId)
    if (!tournament) return

    // Initialize court usage tracking for this round
    if (!tournament.americanoState.courtUsageByRound[roundNumber]) {
      tournament.americanoState.courtUsageByRound[roundNumber] = {}
    }

    matches.forEach(match => {
      // Track which players participated in this round
      match.players.forEach(playerId => {
        if (!tournament.americanoState.playerRoundParticipation[playerId]) {
          tournament.americanoState.playerRoundParticipation[playerId] = []
        }
        if (!tournament.americanoState.playerRoundParticipation[playerId].includes(roundNumber)) {
          tournament.americanoState.playerRoundParticipation[playerId].push(roundNumber)
        }

        // Track court history for each player
        if (!tournament.americanoState.playerCourtHistory[playerId]) {
          tournament.americanoState.playerCourtHistory[playerId] = []
        }
        if (!tournament.americanoState.playerCourtHistory[playerId].includes(match.courtNumber)) {
          tournament.americanoState.playerCourtHistory[playerId].push(match.courtNumber)
        }
      })

      // Track which players are on each court for this round
      if (!tournament.americanoState.courtUsageByRound[roundNumber][match.courtNumber]) {
        tournament.americanoState.courtUsageByRound[roundNumber][match.courtNumber] = []
      }
      tournament.americanoState.courtUsageByRound[roundNumber][match.courtNumber].push(...match.players)
    })

    tournament.lastUpdated = new Date().toISOString()
    this.saveTournament(tournament)
  },

  // Update partnership and opponent tracking with enhanced opponent pair tracking
  updatePairingTracking(
    tournamentId: string,
    matches: Array<{ players: [string, string, string, string] }>
  ): void {
    const tournament = this.getTournament(tournamentId)
    if (!tournament) return

    matches.forEach(match => {
      const [p1, p2, p3, p4] = match.players

      // Update partnership history and counts
      const partnerships = [[p1, p2], [p3, p4]]
      partnerships.forEach(([player1, player2]) => {
        // Add to pairing history
        if (!tournament.americanoState.pairingHistory[player1].includes(player2)) {
          tournament.americanoState.pairingHistory[player1].push(player2)
        }
        if (!tournament.americanoState.pairingHistory[player2].includes(player1)) {
          tournament.americanoState.pairingHistory[player2].push(player1)
        }

        // Update partnership counts
        if (!tournament.americanoState.partnershipCounts[player1][player2]) {
          tournament.americanoState.partnershipCounts[player1][player2] = 0
        }
        if (!tournament.americanoState.partnershipCounts[player2][player1]) {
          tournament.americanoState.partnershipCounts[player2][player1] = 0
        }
        tournament.americanoState.partnershipCounts[player1][player2]++
        tournament.americanoState.partnershipCounts[player2][player1]++
      })

      // Update opponent history (individual opponents)
      const opponents = [[p1, p3], [p1, p4], [p2, p3], [p2, p4]]
      opponents.forEach(([player1, player2]) => {
        if (!tournament.americanoState.opponentHistory[player1].includes(player2)) {
          tournament.americanoState.opponentHistory[player1].push(player2)
        }
        if (!tournament.americanoState.opponentHistory[player2].includes(player1)) {
          tournament.americanoState.opponentHistory[player2].push(player1)
        }
      })

      // Track opponent pairs (the EXACT two players they faced as a team)
      const team1 = [p1, p2].sort().join('+')
      const team2 = [p3, p4].sort().join('+')

      // Team 1 faced Team 2
      if (!tournament.americanoState.opponentPairHistory[p1].includes(team2)) {
        tournament.americanoState.opponentPairHistory[p1].push(team2)
      }
      if (!tournament.americanoState.opponentPairHistory[p2].includes(team2)) {
        tournament.americanoState.opponentPairHistory[p2].push(team2)
      }

      // Team 2 faced Team 1
      if (!tournament.americanoState.opponentPairHistory[p3].includes(team1)) {
        tournament.americanoState.opponentPairHistory[p3].push(team1)
      }
      if (!tournament.americanoState.opponentPairHistory[p4].includes(team1)) {
        tournament.americanoState.opponentPairHistory[p4].push(team1)
      }

      // Track 4-player match groups (CRITICAL FOR PREVENTING SAME GROUPS)
      const matchGroupKey = [p1, p2, p3, p4].sort().join('+')
      if (!tournament.americanoState.matchGroupHistory[matchGroupKey]) {
        tournament.americanoState.matchGroupHistory[matchGroupKey] = 0
      }
      tournament.americanoState.matchGroupHistory[matchGroupKey]++

      // Track which groups each player has been in
      [p1, p2, p3, p4].forEach(playerId => {
        if (!tournament.americanoState.playerMatchGroupHistory[playerId].includes(matchGroupKey)) {
          tournament.americanoState.playerMatchGroupHistory[playerId].push(matchGroupKey)
        }
      })
    })

    tournament.lastUpdated = new Date().toISOString()
    this.saveTournament(tournament)
  },

  // Log administrative actions for audit trail
  logAdminAction(tournamentId: string, action: string, details: any): void {
    const tournament = this.getTournament(tournamentId)
    if (!tournament) return

    if (!tournament.adminHistory) {
      tournament.adminHistory = []
    }

    tournament.adminHistory.push({
      timestamp: new Date().toISOString(),
      action: action as any,
      details
    })

    // Keep only last 100 actions to prevent storage bloat
    if (tournament.adminHistory.length > 100) {
      tournament.adminHistory = tournament.adminHistory.slice(-100)
    }

    tournament.lastUpdated = new Date().toISOString()
    this.saveTournament(tournament)
  },

  // Generate checksum for data integrity verification
  generateChecksum(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  },

  // Comprehensive migration for existing tournaments
  migrateToV2(): void {
    if (typeof window === 'undefined') return

    const tournaments = this.getAllTournaments()
    let migrated = false

    const { calculateTournamentStats } = require('./tournament-calculator')

    const migratedTournaments = tournaments.map(tournament => {
      // Skip if already migrated to v2
      if (tournament.metadata?.tournamentVersion === '2.0.0') {
        return tournament
      }

      console.log(`Migrating tournament ${tournament.id} to v2.0.0 with complete persistence`)

      const now = new Date().toISOString()
      const updatedTournament: StoredTournament = {
        ...tournament,
        lastUpdated: tournament.lastUpdated || now,

        // Initialize Americano state if missing
        americanoState: tournament.americanoState || {
          pairingHistory: tournament.players.reduce((acc, player) => {
            acc[player.id] = []
            return acc
          }, {} as { [playerId: string]: string[] }),
          partnershipCounts: tournament.players.reduce((acc, player) => {
            acc[player.id] = {}
            return acc
          }, {} as { [playerId: string]: { [partnerId: string]: number } }),
          opponentHistory: tournament.players.reduce((acc, player) => {
            acc[player.id] = []
            return acc
          }, {} as { [playerId: string]: string[] }),
          opponentPairHistory: tournament.players.reduce((acc, player) => {
            acc[player.id] = []
            return acc
          }, {} as { [playerId: string]: string[] }),
          playerRoundParticipation: tournament.players.reduce((acc, player) => {
            acc[player.id] = []
            return acc
          }, {} as { [playerId: string]: number[] }),
          playerCourtHistory: tournament.players.reduce((acc, player) => {
            acc[player.id] = []
            return acc
          }, {} as { [playerId: string]: number[] }),
          courtUsageByRound: {},
          matchGroupHistory: {},
          playerMatchGroupHistory: tournament.players.reduce((acc, player) => {
            acc[player.id] = []
            return acc
          }, {} as { [playerId: string]: string[] }),
          totalRoundsGenerated: tournament.rounds?.length || 0,
          algorithmVersion: '3.0.0'
        },

        // Initialize admin history
        adminHistory: tournament.adminHistory || [{
          timestamp: now,
          action: 'TOURNAMENT_SETTING_CHANGED',
          details: { message: 'Tournament migrated to v2.0.0' }
        }],

        // Initialize metadata
        metadata: {
          tournamentVersion: '2.0.0',
          lastEngineRecreation: now,
          persistenceChecksum: this.generateChecksum({
            players: tournament.players,
            rounds: tournament.rounds || []
          })
        }
      }

      // Rebuild pairing history from existing rounds if any exist
      if (tournament.rounds && tournament.rounds.length > 0) {
        tournament.rounds.forEach(round => {
          round.matches.forEach(match => {
            // Include ALL matches (pending, in progress, completed) for historical tracking
            const partnerships = [
              [match.player1Id, match.player2Id],
              [match.player3Id, match.player4Id]
            ]
            const opponents = [
              [match.player1Id, match.player3Id],
              [match.player1Id, match.player4Id],
              [match.player2Id, match.player3Id],
              [match.player2Id, match.player4Id]
            ]

            partnerships.forEach(([p1, p2]) => {
              if (!updatedTournament.americanoState.pairingHistory[p1].includes(p2)) {
                updatedTournament.americanoState.pairingHistory[p1].push(p2)
              }
              if (!updatedTournament.americanoState.pairingHistory[p2].includes(p1)) {
                updatedTournament.americanoState.pairingHistory[p2].push(p1)
              }

              // Update counts
              if (!updatedTournament.americanoState.partnershipCounts[p1][p2]) {
                updatedTournament.americanoState.partnershipCounts[p1][p2] = 0
              }
              if (!updatedTournament.americanoState.partnershipCounts[p2][p1]) {
                updatedTournament.americanoState.partnershipCounts[p2][p1] = 0
              }
              updatedTournament.americanoState.partnershipCounts[p1][p2]++
              updatedTournament.americanoState.partnershipCounts[p2][p1]++
            })

            opponents.forEach(([p1, p2]) => {
              if (!updatedTournament.americanoState.opponentHistory[p1].includes(p2)) {
                updatedTournament.americanoState.opponentHistory[p1].push(p2)
              }
              if (!updatedTournament.americanoState.opponentHistory[p2].includes(p1)) {
                updatedTournament.americanoState.opponentHistory[p2].push(p1)
              }
            })

            // Track opponent pairs (e.g., "player3+player4" for team facing player1+player2)
            const team1 = [match.player1Id, match.player2Id].sort().join('+')
            const team2 = [match.player3Id, match.player4Id].sort().join('+')

            if (!updatedTournament.americanoState.opponentPairHistory[match.player1Id].includes(team2)) {
              updatedTournament.americanoState.opponentPairHistory[match.player1Id].push(team2)
            }
            if (!updatedTournament.americanoState.opponentPairHistory[match.player2Id].includes(team2)) {
              updatedTournament.americanoState.opponentPairHistory[match.player2Id].push(team2)
            }
            if (!updatedTournament.americanoState.opponentPairHistory[match.player3Id].includes(team1)) {
              updatedTournament.americanoState.opponentPairHistory[match.player3Id].push(team1)
            }
            if (!updatedTournament.americanoState.opponentPairHistory[match.player4Id].includes(team1)) {
              updatedTournament.americanoState.opponentPairHistory[match.player4Id].push(team1)
            }

            // Track 4-player match groups (CRITICAL FOR PREVENTING SAME GROUPS)
            const matchGroupKey = [match.player1Id, match.player2Id, match.player3Id, match.player4Id].sort().join('+')
            if (!updatedTournament.americanoState.matchGroupHistory[matchGroupKey]) {
              updatedTournament.americanoState.matchGroupHistory[matchGroupKey] = 0
            }
            updatedTournament.americanoState.matchGroupHistory[matchGroupKey]++

            // Track which groups each player has been in
            [match.player1Id, match.player2Id, match.player3Id, match.player4Id].forEach(playerId => {
              if (!updatedTournament.americanoState.playerMatchGroupHistory[playerId].includes(matchGroupKey)) {
                updatedTournament.americanoState.playerMatchGroupHistory[playerId].push(matchGroupKey)
              }
            })

            // Track participation and court usage
            [match.player1Id, match.player2Id, match.player3Id, match.player4Id].forEach(playerId => {
              if (!updatedTournament.americanoState.playerRoundParticipation[playerId].includes(round.roundNumber)) {
                updatedTournament.americanoState.playerRoundParticipation[playerId].push(round.roundNumber)
              }
              // Track court history
              if (match.courtNumber && !updatedTournament.americanoState.playerCourtHistory[playerId].includes(match.courtNumber)) {
                updatedTournament.americanoState.playerCourtHistory[playerId].push(match.courtNumber)
              }
            })

            // Track court usage by round
            if (!updatedTournament.americanoState.courtUsageByRound[round.roundNumber]) {
              updatedTournament.americanoState.courtUsageByRound[round.roundNumber] = {}
            }
            if (match.courtNumber) {
              if (!updatedTournament.americanoState.courtUsageByRound[round.roundNumber][match.courtNumber]) {
                updatedTournament.americanoState.courtUsageByRound[round.roundNumber][match.courtNumber] = []
              }
              updatedTournament.americanoState.courtUsageByRound[round.roundNumber][match.courtNumber].push(
                match.player1Id, match.player2Id, match.player3Id, match.player4Id
              )
            }
          })
        })
      }

      migrated = true
      return updatedTournament
    })

    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedTournaments))
      console.log('All tournaments migrated to v2.0.0 with complete persistence')
    }
  }
}
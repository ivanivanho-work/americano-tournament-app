// Utility functions for tournament calculations

export interface TournamentStats {
  totalRounds: number
  totalMatches: number
  matchesPerRound: number
  playersPerRound: number
  estimatedDuration: number // in minutes
  targetDuration: number // in minutes
  roundsForTargetDuration: number
}

export function calculateTournamentStats(numPlayers: number, numCourts: number, pointsPerMatch: number = 24, targetDurationMinutes: number = 105): TournamentStats {
  if (numPlayers < 4) {
    return {
      totalRounds: 0,
      totalMatches: 0,
      matchesPerRound: 0,
      playersPerRound: 0,
      estimatedDuration: 0,
      targetDuration: targetDurationMinutes,
      roundsForTargetDuration: 0
    }
  }

  const matchesPerRound = Math.min(Math.floor(numPlayers / 4), numCourts)
  const playersPerRound = matchesPerRound * 4

  // Estimate 15-20 minutes per match depending on points
  const minutesPerMatch = Math.ceil(pointsPerMatch / 24 * 18) // Base 18 min for 24 points

  // Calculate rounds based on target duration (90-120 minutes)
  const roundsForTargetDuration = Math.floor(targetDurationMinutes / minutesPerMatch)

  // For Americano tournaments, we also want enough rounds for good player mixing
  // Better formula: aim for each player to partner with at least 60% of other players
  // With 12 players, each player has 11 potential partners
  // In each round, they partner with 1 player and play against 2
  // So ideally we want rounds where each player partners with ~7 different people
  const idealRoundsForMixing = Math.ceil((numPlayers - 1) * 0.6)

  // Use the smaller of: target duration constraint OR ideal mixing
  // But ensure minimum of 4 rounds and maximum of 10
  const totalRounds = Math.max(4, Math.min(roundsForTargetDuration, idealRoundsForMixing, 10))

  const totalMatches = totalRounds * matchesPerRound
  const estimatedDuration = totalRounds * minutesPerMatch

  return {
    totalRounds,
    totalMatches,
    matchesPerRound,
    playersPerRound,
    estimatedDuration,
    targetDuration: targetDurationMinutes,
    roundsForTargetDuration
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}
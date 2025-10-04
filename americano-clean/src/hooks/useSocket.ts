'use client'

import { useEffect, useRef } from 'react'
import { getSocket, SocketEvents } from '@/lib/socket'
import { Socket } from 'socket.io-client'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    socketRef.current = getSocket()

    socketRef.current.on('connect', () => {
      console.log('Socket connected')
    })

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  return socketRef.current
}

export function useTournamentSocket(
  tournamentId: string,
  callbacks: Partial<{
    onScoreUpdate: (data: { matchId: string, team1Score: number, team2Score: number }) => void
    onMatchCompleted: (data: { matchId: string }) => void
    onRoundCompleted: (data: { roundNumber: number }) => void
    onNewRound: (data: { roundNumber: number }) => void
    onLeaderboardUpdate: (data: { leaderboard: Array<{ id: string, name: string, totalPoints: number }> }) => void
  }>
) {
  const socket = useSocket()

  useEffect(() => {
    if (!socket || !tournamentId) return

    // Join the tournament room
    socket.emit('join-tournament', tournamentId)

    // Set up event listeners
    if (callbacks.onScoreUpdate) {
      socket.on('tournament:score_updated', callbacks.onScoreUpdate)
    }

    if (callbacks.onMatchCompleted) {
      socket.on('match:completed', callbacks.onMatchCompleted)
    }

    if (callbacks.onRoundCompleted) {
      socket.on('tournament:round_completed', callbacks.onRoundCompleted)
    }

    if (callbacks.onNewRound) {
      socket.on('tournament:new_round', callbacks.onNewRound)
    }

    if (callbacks.onLeaderboardUpdate) {
      socket.on('leaderboard:updated', callbacks.onLeaderboardUpdate)
    }

    return () => {
      // Clean up event listeners
      socket.off('tournament:score_updated')
      socket.off('match:completed')
      socket.off('tournament:round_completed')
      socket.off('tournament:new_round')
      socket.off('leaderboard:updated')

      // Leave the tournament room
      socket.emit('leave-tournament', tournamentId)
    }
  }, [socket, tournamentId, callbacks])

  const emitScoreUpdate = (matchId: string, team1Score: number, team2Score: number) => {
    if (socket) {
      socket.emit('score-update', { tournamentId, matchId, team1Score, team2Score })
    }
  }

  const emitMatchCompleted = (matchId: string) => {
    if (socket) {
      socket.emit('match-completed', { tournamentId, matchId })
    }
  }

  const emitRoundCompleted = (roundNumber: number) => {
    if (socket) {
      socket.emit('round-completed', { tournamentId, roundNumber })
    }
  }

  const emitNewRound = (roundNumber: number) => {
    if (socket) {
      socket.emit('new-round', { tournamentId, roundNumber })
    }
  }

  const emitLeaderboardUpdate = (leaderboard: Array<{ id: string, name: string, totalPoints: number }>) => {
    if (socket) {
      socket.emit('leaderboard-update', { tournamentId, leaderboard })
    }
  }

  return {
    socket,
    emitScoreUpdate,
    emitMatchCompleted,
    emitRoundCompleted,
    emitNewRound,
    emitLeaderboardUpdate,
  }
}
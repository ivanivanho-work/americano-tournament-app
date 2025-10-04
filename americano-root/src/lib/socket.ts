import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { io as ClientIO } from 'socket.io-client'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

// Client-side socket connection
let socket: ReturnType<typeof ClientIO> | null = null

export const getSocket = () => {
  if (!socket) {
    socket = ClientIO(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      path: '/api/socket',
      addTrailingSlash: false,
    })
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Socket event types
export interface SocketEvents {
  // Tournament events
  'tournament:updated': (tournamentId: string) => void
  'tournament:score_updated': (data: { tournamentId: string, matchId: string, team1Score: number, team2Score: number }) => void
  'tournament:round_completed': (data: { tournamentId: string, roundNumber: number }) => void
  'tournament:new_round': (data: { tournamentId: string, roundNumber: number }) => void

  // Player events
  'player:joined': (data: { tournamentId: string, playerName: string }) => void
  'player:left': (data: { tournamentId: string, playerName: string }) => void

  // Leaderboard events
  'leaderboard:updated': (data: { tournamentId: string, leaderboard: Array<{ id: string, name: string, totalPoints: number }> }) => void

  // Match events
  'match:started': (data: { tournamentId: string, matchId: string }) => void
  'match:completed': (data: { tournamentId: string, matchId: string }) => void
}

// Helper function to emit events from server-side
export const emitToTournament = (io: ServerIO, tournamentId: string, event: keyof SocketEvents, data: any) => {
  io.to(`tournament:${tournamentId}`).emit(event, data)
}

// Helper function to join/leave tournament rooms
export const joinTournamentRoom = (socket: any, tournamentId: string) => {
  socket.join(`tournament:${tournamentId}`)
}

export const leaveTournamentRoom = (socket: any, tournamentId: string) => {
  socket.leave(`tournament:${tournamentId}`)
}
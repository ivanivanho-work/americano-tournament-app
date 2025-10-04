import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'
import { NextApiResponseServerIO } from '@/lib/socket'

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new ServerIO(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    })
    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // Handle joining tournament rooms
      socket.on('join-tournament', (tournamentId: string) => {
        socket.join(`tournament:${tournamentId}`)
        console.log(`Socket ${socket.id} joined tournament:${tournamentId}`)
      })

      // Handle leaving tournament rooms
      socket.on('leave-tournament', (tournamentId: string) => {
        socket.leave(`tournament:${tournamentId}`)
        console.log(`Socket ${socket.id} left tournament:${tournamentId}`)
      })

      // Handle score updates
      socket.on('score-update', (data) => {
        const { tournamentId, matchId, team1Score, team2Score } = data
        // Broadcast to all clients in the tournament room
        socket.to(`tournament:${tournamentId}`).emit('tournament:score_updated', {
          tournamentId,
          matchId,
          team1Score,
          team2Score
        })
      })

      // Handle match completion
      socket.on('match-completed', (data) => {
        const { tournamentId, matchId } = data
        socket.to(`tournament:${tournamentId}`).emit('match:completed', {
          tournamentId,
          matchId
        })
      })

      // Handle round completion
      socket.on('round-completed', (data) => {
        const { tournamentId, roundNumber } = data
        socket.to(`tournament:${tournamentId}`).emit('tournament:round_completed', {
          tournamentId,
          roundNumber
        })
      })

      // Handle new round
      socket.on('new-round', (data) => {
        const { tournamentId, roundNumber } = data
        socket.to(`tournament:${tournamentId}`).emit('tournament:new_round', {
          tournamentId,
          roundNumber
        })
      })

      // Handle leaderboard updates
      socket.on('leaderboard-update', (data) => {
        const { tournamentId, leaderboard } = data
        socket.to(`tournament:${tournamentId}`).emit('leaderboard:updated', {
          tournamentId,
          leaderboard
        })
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }
  res.end()
}

export const config = {
  api: {
    bodyParser: false,
  },
}
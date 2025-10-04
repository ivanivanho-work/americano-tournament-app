'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/Footer"
import { TournamentStorage, type StoredTournament } from "@/lib/tournament-storage"
import { Trophy, Users, Plus, Clock } from "lucide-react"

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<StoredTournament[]>([])

  useEffect(() => {
    // Run both migrations for existing tournaments
    TournamentStorage.migrateTournaments() // Legacy migration
    TournamentStorage.migrateToV2() // New comprehensive migration for persistence

    // Load tournaments from storage
    const loadedTournaments = TournamentStorage.getAllTournaments()
    setTournaments(loadedTournaments)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="w-4 h-4" />
      case 'COMPLETED':
        return <Trophy className="w-4 h-4" />
      case 'DRAFT':
        return <Users className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-white/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 md:space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
              <Trophy className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-black">Americano</h1>
          </Link>
          <Link href="/tournaments/new">
            <Button variant="primary" size="sm" className="text-sm md:text-base">
              <Plus className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
              <span className="hidden sm:inline">New Tournament</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">Tournaments</h2>
          <p className="text-sm md:text-base text-gray-600">
            Join an existing tournament or create a new one to get started.
          </p>
        </div>

        {/* Tournament Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tournaments.map((tournament) => (
            <Card
              key={tournament.id}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl text-black">{tournament.name}</CardTitle>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 ${getStatusColor(tournament.status)}`}
                  >
                    {getStatusIcon(tournament.status)}
                    <span className="capitalize">{tournament.status.toLowerCase()}</span>
                  </span>
                </div>
                <p className="text-gray-800">{tournament.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{tournament.players.length} players</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{new Date(tournament.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="pt-2 space-y-2">
                    <Link href={`/tournaments/${tournament.id}`}>
                      <Button
                        variant={tournament.status === 'ACTIVE' ? 'primary' : 'outline'}
                        className="w-full"
                      >
                        {tournament.status === 'ACTIVE' ? 'View Live' : 'View Details'}
                      </Button>
                    </Link>
                    <Link href={`/tournaments/${tournament.id}/players`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        Manage Players
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Tournament Card */}
          <Link href="/tournaments/new">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-dashed border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-primary-100">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  Create New Tournament
                </h3>
                <p className="text-gray-600">
                  Set up a new Americano tournament and invite players to join.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {tournaments.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-black mb-2">
              No tournaments yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first tournament to get started with Americano.
            </p>
            <Link href="/tournaments/new">
              <Button variant="primary" size="lg" className="text-sm md:text-base">
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Create Your First Tournament
              </Button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TournamentStorage } from "@/lib/tournament-storage"
import { Settings, UserPlus, UserMinus, Edit3, Save, X, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface AdminPanelProps {
  tournament: any
  onTournamentUpdate: (updatedTournament: any) => void
}

export function AdminPanel({ tournament, onTournamentUpdate }: AdminPanelProps) {
  const router = useRouter()
  const [showAdmin, setShowAdmin] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [editingPlayer, setEditingPlayer] = useState<{ id: string, score: number } | null>(null)
  const [tempScore, setTempScore] = useState('')
  const [editingCourts, setEditingCourts] = useState(false)
  const [tempCourts, setTempCourts] = useState('')
  const [editingRounds, setEditingRounds] = useState(false)
  const [tempRounds, setTempRounds] = useState('')

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      TournamentStorage.addPlayer(tournament.id, newPlayerName)
      setNewPlayerName('')

      // Refresh tournament data
      const updatedTournament = TournamentStorage.getTournament(tournament.id)
      if (updatedTournament) {
        onTournamentUpdate(updatedTournament)
      }
    }
  }

  const handleRemovePlayer = (playerId: string) => {
    if (confirm('Are you sure you want to remove this player? This will affect the tournament.')) {
      TournamentStorage.removePlayer(tournament.id, playerId)

      // Refresh tournament data
      const updatedTournament = TournamentStorage.getTournament(tournament.id)
      if (updatedTournament) {
        onTournamentUpdate(updatedTournament)
      }
    }
  }

  const handleEditScore = (playerId: string, currentScore: number) => {
    setEditingPlayer({ id: playerId, score: currentScore })
    setTempScore(currentScore.toString())
  }

  const handleSaveScore = () => {
    if (editingPlayer && tempScore.trim()) {
      const newScore = parseInt(tempScore)
      if (!isNaN(newScore)) {
        TournamentStorage.updatePlayerScore(tournament.id, editingPlayer.id, newScore)

        // Refresh tournament data
        const updatedTournament = TournamentStorage.getTournament(tournament.id)
        if (updatedTournament) {
          onTournamentUpdate(updatedTournament)
        }
      }
    }
    setEditingPlayer(null)
    setTempScore('')
  }

  const handleCancelEdit = () => {
    setEditingPlayer(null)
    setTempScore('')
  }

  const handleEditCourts = () => {
    const currentValue = tournament.numberOfCourts?.toString() || '1'
    setEditingCourts(true)
    setTempCourts(currentValue)
  }

  const handleSaveCourts = () => {
    if (tempCourts.trim()) {
      const newCourts = parseInt(tempCourts)
      if (!isNaN(newCourts) && newCourts >= 1 && newCourts <= 6) {
        TournamentStorage.updateTournament(tournament.id, { numberOfCourts: newCourts })

        // Refresh tournament data
        const updatedTournament = TournamentStorage.getTournament(tournament.id)
        if (updatedTournament) {
          onTournamentUpdate(updatedTournament)
        }
      }
    }
    setEditingCourts(false)
    setTempCourts('')
  }

  const handleCancelCourts = () => {
    setEditingCourts(false)
    setTempCourts('')
  }

  const handleEditRounds = () => {
    const currentValue = tournament.maxRounds?.toString() || '6'
    setEditingRounds(true)
    setTempRounds(currentValue)
  }

  const handleSaveRounds = () => {
    if (tempRounds.trim()) {
      const newMaxRounds = parseInt(tempRounds)
      if (!isNaN(newMaxRounds) && newMaxRounds >= 1 && newMaxRounds <= 50) {
        TournamentStorage.updateTournament(tournament.id, {
          maxRounds: newMaxRounds
        })

        // Refresh tournament data
        const updatedTournament = TournamentStorage.getTournament(tournament.id)
        if (updatedTournament) {
          onTournamentUpdate(updatedTournament)
        }
      }
    }
    setEditingRounds(false)
    setTempRounds('')
  }

  const handleCancelRounds = () => {
    setEditingRounds(false)
    setTempRounds('')
  }

  const handleDeleteTournament = () => {
    const confirmMessage = `Are you sure you want to delete "${tournament.name}"?\n\nThis action cannot be undone and will permanently delete:\n- All tournament data\n- All player scores\n- All match history\n\nType "DELETE" to confirm:`

    const userInput = prompt(confirmMessage)

    if (userInput === 'DELETE') {
      const success = TournamentStorage.deleteTournament(tournament.id)
      if (success) {
        alert('Tournament deleted successfully!')
        router.push('/tournaments')
      } else {
        alert('Failed to delete tournament. Please try again.')
      }
    }
  }

  if (!showAdmin) {
    return (
      <Button
        onClick={() => setShowAdmin(true)}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Settings className="w-4 h-4" />
        <span>Admin Controls</span>
      </Button>
    )
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <Settings className="w-5 h-5" />
            <span>Admin Controls</span>
          </CardTitle>
          <Button
            onClick={() => setShowAdmin(false)}
            variant="ghost"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Player */}
        <div className="space-y-3">
          <h4 className="font-semibold text-black">Add Player</h4>
          <div className="flex space-x-2">
            <Input
              placeholder="Player name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
            />
            <Button
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim()}
              variant="secondary"
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Manage Players */}
        <div className="space-y-3">
          <h4 className="font-semibold text-black">Manage Players</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tournament.players.map((player: any) => (
              <div key={player.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-black">{player.name}</span>
                  <div className="flex items-center space-x-2">
                    {editingPlayer?.id === player.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={tempScore}
                          onChange={(e) => setTempScore(e.target.value)}
                          className="w-20 h-8"
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveScore()}
                        />
                        <Button onClick={handleSaveScore} variant="ghost" size="sm">
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button onClick={handleCancelEdit} variant="ghost" size="sm">
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{player.totalPoints} pts</span>
                        <Button
                          onClick={() => handleEditScore(player.id, player.totalPoints)}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit3 className="w-4 h-4 text-blue-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleRemovePlayer(player.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-800"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Tournament Settings */}
        <div className="space-y-3">
          <h4 className="font-semibold text-black">Tournament Settings</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
              <div>
                <span className="font-medium text-black">Number of Courts</span>
                <p className="text-sm text-gray-600">Change how many courts are available</p>
              </div>
              <div className="flex items-center space-x-2">
                {editingCourts ? (
                  <>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={tempCourts}
                      onChange={(e) => setTempCourts(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveCourts()}
                      className="w-20 px-2 py-1 border rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <Button onClick={handleSaveCourts} variant="ghost" size="sm">
                      <Save className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button onClick={handleCancelCourts} variant="ghost" size="sm">
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-600">{tournament.numberOfCourts || 1} courts</span>
                    <Button
                      onClick={handleEditCourts}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit3 className="w-4 h-4 text-blue-600" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
              <div>
                <span className="font-medium text-black">Number of Rounds</span>
                <p className="text-sm text-gray-600">Set how many rounds will be played in this tournament</p>
              </div>
              <div className="flex items-center space-x-2">
                {editingRounds ? (
                  <>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={tempRounds}
                      onChange={(e) => setTempRounds(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveRounds()}
                      className="w-20 px-2 py-1 border rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <Button onClick={handleSaveRounds} variant="ghost" size="sm">
                      <Save className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button onClick={handleCancelRounds} variant="ghost" size="sm">
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-600">{tournament.maxRounds || 'N/A'} rounds</span>
                    <Button
                      onClick={handleEditRounds}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit3 className="w-4 h-4 text-blue-600" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Tournament */}
        <div className="space-y-3">
          <h4 className="font-semibold text-black">Danger Zone</h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-red-800">Delete Tournament</h5>
                <p className="text-sm text-red-600">
                  Permanently delete this tournament. This action cannot be undone.
                </p>
              </div>
              <Button
                onClick={handleDeleteTournament}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Tournament
              </Button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            <strong>⚠️ Warning:</strong> Removing players or changing scores will affect ongoing matches and the tournament structure.
            Changes take effect immediately and will regenerate rounds if needed.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
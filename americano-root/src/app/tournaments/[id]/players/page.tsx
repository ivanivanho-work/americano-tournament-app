'use client'

import { useState, useEffect, use } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TournamentStorage } from "@/lib/tournament-storage"
import { RefreshButton } from "@/components/RefreshButton"
import { Footer } from "@/components/Footer"
import { Trophy, ArrowLeft, Users, Copy, ExternalLink } from "lucide-react"
import QRCode from 'qrcode'

export default function PlayerManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [tournament, setTournament] = useState<any>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [qrCodes, setQrCodes] = useState<{[key: string]: string}>({})
  const [baseUrl, setBaseUrl] = useState<string>('')

  useEffect(() => {
    // Set base URL on client side only
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  useEffect(() => {
    const storedTournament = TournamentStorage.getTournament(resolvedParams.id)
    if (storedTournament && baseUrl) {
      setTournament(storedTournament)

      // Generate QR codes for all players
      const generateQRCodes = async () => {
        const codes: {[key: string]: string} = {}
        for (const player of storedTournament.players) {
          const playerSlug = player.name.toLowerCase().replace(/\s+/g, '-')
          const playerUrl = `${baseUrl}/play/${storedTournament.id}?player=${playerSlug}`
          try {
            const qrDataURL = await QRCode.toDataURL(playerUrl, {
              width: 120,
              margin: 1,
              color: {
                dark: '#1f2937',
                light: '#ffffff'
              }
            })
            codes[player.id] = qrDataURL
          } catch (error) {
            console.error(`Failed to generate QR code for ${player.name}:`, error)
          }
        }
        setQrCodes(codes)
      }

      generateQRCodes()
    }
  }, [resolvedParams.id, baseUrl])

  const handleRefresh = () => {
    const freshTournament = TournamentStorage.getTournament(resolvedParams.id)
    if (freshTournament && baseUrl) {
      setTournament(freshTournament)

      // Regenerate QR codes for updated tournament
      const generateQRCodes = async () => {
        const codes: {[key: string]: string} = {}
        for (const player of freshTournament.players) {
          const playerSlug = player.name.toLowerCase().replace(/\s+/g, '-')
          const playerUrl = `${baseUrl}/play/${freshTournament.id}?player=${playerSlug}`
          try {
            const qrDataURL = await QRCode.toDataURL(playerUrl, {
              width: 120,
              margin: 1,
              color: {
                dark: '#1f2937',
                light: '#ffffff'
              }
            })
            codes[player.id] = qrDataURL
          } catch (error) {
            console.error(`Failed to generate QR code for ${player.name}:`, error)
          }
        }
        setQrCodes(codes)
      }

      generateQRCodes()
    }
  }

  const copyToClipboard = async (url: string, playerName: string) => {
    try {
      if (!url) {
        console.error('No URL to copy')
        return
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      alert('Failed to copy URL. Please try again.')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-white/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href={`/tournaments/${resolvedParams.id}`} className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-600 flex-shrink-0" />
            <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-black truncate">Player Access</h1>
                <p className="text-sm md:text-base text-gray-700 truncate">{tournament.name}</p>
              </div>
            </div>
          </Link>
          <div className="flex-shrink-0">
            <RefreshButton onRefresh={handleRefresh} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-primary-500" />
                <span>Share Player Access</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Each player gets their own personalized URL to access the tournament.
                  They'll see only their matches, can enter scores, and track their progress.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">How to share:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• <strong>Copy & Send:</strong> Copy the URL and send via text/email/WhatsApp</li>
                    <li>• <strong>QR Codes:</strong> Players scan the QR code with their phone camera to instantly join</li>
                    <li>• <strong>Go To Player:</strong> Test the player experience before sharing</li>
                    <li>• <strong>Quick Copy:</strong> Use the "Copy Player Access Link" button in the admin page for easy sharing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player URLs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-primary-500" />
                  <span>Player Access ({tournament.players.length})</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tournament.players.map((player: any) => {
                  const playerSlug = player.name.toLowerCase().replace(/\s+/g, '-')
                  const playerUrl = baseUrl ? `${baseUrl}/play/${tournament.id}?player=${playerSlug}` : ''
                  const isUrlCopied = copiedUrl === playerUrl

                  return (
                    <div key={player.id} className="border border-gray-200 rounded-xl p-3 md:p-4 hover:border-primary-200 transition-colors">
                      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-primary-700">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-black truncate">{player.name}</h3>
                            <p className="text-sm text-gray-600">{player.totalPoints} points</p>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-2">
                          <Button
                            onClick={() => copyToClipboard(playerUrl, player.name)}
                            variant={isUrlCopied ? "secondary" : "outline"}
                            size="sm"
                            className="flex-1 md:flex-initial"
                            disabled={!playerUrl}
                          >
                            <Copy className="w-4 h-4 md:mr-2" />
                            <span className="hidden sm:inline">{isUrlCopied ? 'Copied!' : 'Copy URL'}</span>
                          </Button>

                          {playerUrl ? (
                            <Link href={playerUrl} target="_blank" className="w-full md:w-auto">
                              <Button variant="outline" size="sm" className="w-full md:w-auto">
                                <ExternalLink className="w-4 h-4 md:mr-2" />
                                <span className="hidden sm:inline">Go To Player</span>
                                <span className="sm:hidden">Open</span>
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="outline" size="sm" className="w-full md:w-auto" disabled>
                              <ExternalLink className="w-4 h-4 md:mr-2" />
                              <span className="hidden sm:inline">Loading...</span>
                              <span className="sm:hidden">...</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="mt-3 md:mt-4 text-center">
                        <div className="inline-block bg-white border-2 border-gray-200 rounded-lg p-3 md:p-4">
                          {qrCodes[player.id] ? (
                            <div className="space-y-2">
                              <img
                                src={qrCodes[player.id]}
                                alt={`QR Code for ${player.name}`}
                                className="w-20 h-20 md:w-24 md:h-24 mx-auto"
                              />
                              <p className="text-xs text-gray-600">Scan to join as {player.name}</p>
                            </div>
                          ) : (
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="text-center pt-4">
            <Link href={`/tournaments/${resolvedParams.id}`}>
              <Button variant="primary" size="lg">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Tournament
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
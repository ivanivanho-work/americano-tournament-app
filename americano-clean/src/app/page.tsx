import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/Footer"
import { Trophy, Users, Clock, Zap, HelpCircle } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-white/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
              <Trophy className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-black">Americano</h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <Link href="/how-it-works">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex md:text-base">
                <HelpCircle className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden md:inline">Need to Know</span>
              </Button>
              <Button variant="outline" size="sm" className="sm:hidden">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button variant="primary" size="sm" className="text-sm md:text-base">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 md:mb-6">
            Padel Americano
            <span className="block text-primary-500">Made Simple</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Create, manage, and enjoy Padel Americano tournaments with automatic pairings,
            real-time scoring, and live leaderboards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tournaments/new">
              <Button variant="primary" size="xl" className="w-full sm:w-auto">
                Create Tournament
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Join Tournament
              </Button>
            </Link>
          </div>
          <div className="mt-6">
            <Link href="/how-it-works">
              <Button variant="ghost" size="lg" className="text-gray-600 hover:text-primary-600">
                <HelpCircle className="w-5 h-5 mr-2" />
                New to Americano? Learn how it works
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card variant="primary" className="hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Smart Pairings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Automatic fair matchmaking ensures everyone plays with and against everyone else.
              </p>
            </CardContent>
          </Card>

          <Card variant="secondary" className="hover:shadow-glow-yellow transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-gray-900" />
              </div>
              <CardTitle className="text-lg">Real-time Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Enter scores instantly and watch the leaderboard update in real-time.
              </p>
            </CardContent>
          </Card>

          <Card variant="accent" className="hover:shadow-glow-mint transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Live Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track individual points and see who's leading throughout the tournament.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Mobile First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Designed for phones - enter scores courtside with large, touch-friendly buttons.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-black mb-12">How Americano Works</h3>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-semibold text-black">Individual Competition</h4>
              <p className="text-gray-600">
                You compete for yourself, even though you play doubles matches. Your goal is to score the most points.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-black">2</span>
              </div>
              <h4 className="text-xl font-semibold text-black">Rotating Partners</h4>
              <p className="text-gray-600">
                Your partner and opponents change every round. The app calculates the fairest pairings automatically.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-semibold text-black">Every Point Counts</h4>
              <p className="text-gray-600">
                Win or lose, you earn points based on your team's score. The highest total wins the tournament!
              </p>
            </div>
          </div>
          <Link href="/tournaments/new">
            <Button variant="primary" size="xl">
              Start Your First Tournament
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

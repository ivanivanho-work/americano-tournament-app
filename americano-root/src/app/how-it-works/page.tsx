import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Clock, Target, ArrowLeft, CheckCircle } from "lucide-react"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Header */}
      <header className="p-6 border-b border-white/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-black">How Americano Works</h1>
            </div>
          </Link>
          <Link href="/tournaments">
            <Button variant="primary" size="lg">
              Start Playing
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Need to Know
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to the Americano format! It's a fun and social way to play a Padel tournament
            where everyone gets to play with and against everyone else.
          </p>
        </div>

        {/* The Basics */}
        <Card variant="primary" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-2xl">
              <Users className="w-8 h-8 text-primary-500" />
              <span>The Basics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2 text-black">Individual Competition</h4>
                <p className="text-gray-700">
                  Even though you play doubles matches, you are competing for yourself.
                  Your goal is to score the most individual points by the end of the tournament.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2 text-black">Rotating Partners</h4>
                <p className="text-gray-700">
                  Your partner and opponents will change every single round.
                  The app automatically calculates the fairest pairings for you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How a Match Works */}
        <Card variant="secondary" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-2xl">
              <Target className="w-8 h-8 text-secondary-600" />
              <span>How a Match Works</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <Target className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2 text-black">Playing to Points, Not Games</h4>
                <p className="text-gray-700">
                  Each match is played to a fixed number of points, which the tournament organizer sets
                  (for example, 24 or 32 total points).
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2 text-black">Every Point Counts</h4>
                <p className="text-gray-700">
                  You play a normal rally for each point. If you and your partner win the rally, your team gets 1 point.
                </p>
              </div>
            </div>
            <div className="bg-secondary-100 rounded-xl p-4 border-l-4 border-secondary-500">
              <h4 className="font-semibold mb-2 text-black">Example Match Score</h4>
              <p className="text-gray-700">
                If the match is played to 24 points, a final score might be <strong>15-9</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How Scoring Works */}
        <Card variant="accent" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-2xl">
              <Trophy className="w-8 h-8 text-accent-600" />
              <span>How Scoring Works</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 text-lg">
              At the end of your match, the score is entered into the app. The points are then assigned to each player individually.
            </p>

            <div className="bg-accent-100 rounded-xl p-6 border-l-4 border-accent-500">
              <h4 className="font-semibold text-lg mb-4 text-black">Using the example score of 15-9:</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-black">The two players on the <strong>winning team</strong> each get <strong>15 points</strong> added to their personal total on the leaderboard.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-black">The two players on the <strong>losing team</strong> each get <strong>9 points</strong> added to their personal total.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-green-800 font-medium text-center">
                Yes, even in a loss, you still collect points!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tournament Flow */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-2xl">
              <Clock className="w-8 h-8 text-purple-500" />
              <span>The Tournament Flow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: "Check the App",
                  description: "After each round, check the app to see your partner, opponents, and court assignment for the next round.",
                  icon: <Users className="w-5 h-5 text-white" />
                },
                {
                  step: 2,
                  title: "Play Your Match",
                  description: "Head to your assigned court and play to the set number of points.",
                  icon: <Target className="w-5 h-5 text-white" />
                },
                {
                  step: 3,
                  title: "Enter the Score",
                  description: "After the match, one player from your court enters the final score into the app.",
                  icon: <CheckCircle className="w-5 h-5 text-white" />
                },
                {
                  step: 4,
                  title: "Check the Leaderboard",
                  description: "Watch the live leaderboard update in real-time!",
                  icon: <Trophy className="w-5 h-5 text-white" />
                },
                {
                  step: 5,
                  title: "Repeat!",
                  description: "Continue for all scheduled rounds.",
                  icon: <Clock className="w-5 h-5 text-white" />
                }
              ].map((item) => (
                <div key={item.step} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-black">{item.title}</h4>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* The Winner */}
        <Card variant="primary" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-2xl">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span>The Winner</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <p className="text-xl text-gray-700 font-medium">
                At the end of all the rounds, the player with the highest total score on the leaderboard is the
                <span className="text-yellow-600 font-bold"> Americano Champion!</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-black mb-4">Ready to Play?</h3>
          <p className="text-gray-600 mb-6">
            Now that you understand how Americano works, create your first tournament!
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
        </div>
      </main>
    </div>
  )
}
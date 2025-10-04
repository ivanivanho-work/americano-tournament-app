import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="mt-auto py-6 border-t border-gray-200/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>
      </div>
    </footer>
  )
}
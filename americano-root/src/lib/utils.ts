import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPlayerName(name: string): string {
  return name.split(' ').map(part =>
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join(' ')
}

export function calculateTotalPoints(team1Score: number, team2Score: number, playerOnTeam1: boolean): number {
  return playerOnTeam1 ? team1Score : team2Score
}

export function getPlayerInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}
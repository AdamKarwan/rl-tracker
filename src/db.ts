import Dexie, { type EntityTable } from 'dexie'
import type { PlaylistId } from './ranks'

export interface Entry {
  id: number
  timestamp: number
  playlist: PlaylistId
  elo: number
  rank: number
  division: number
  goalsFor?: number
  goalsAgainst?: number
  score?: number
  goals?: number
  assists?: number
  saves?: number
  shots?: number
  teammateRanks?: number[]
  opponentRanks?: number[]
}

export type NewEntry = Omit<Entry, 'id'>

export const db = new Dexie('rl-tracker') as Dexie & { entries: EntityTable<Entry, 'id'> }

db.version(1).stores({ entries: '++id, playlist, timestamp' })

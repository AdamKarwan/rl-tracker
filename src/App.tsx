import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import Dashboard from './components/Dashboard'
import EntryForm from './components/EntryForm'
import History from './components/History'
import QuickAdd from './components/QuickAdd'
import { db, type Entry } from './db'
import { PLAYLISTS, type PlaylistId } from './ranks'
import { toRows } from './stats'

const VIEWS = ['Dashboard', 'History'] as const

export default function App() {
  const entries = useLiveQuery(() => db.entries.toArray())
  const rows = useMemo(() => toRows(entries ?? []), [entries])
  const [view, setView] = useState<(typeof VIEWS)[number]>('Dashboard')
  const [filter, setFilter] = useState<PlaylistId | 'all'>('all')
  const [form, setForm] = useState<{ editing?: Entry }>()

  const visible = filter === 'all' ? rows : rows.filter((r) => r.playlist === filter)
  const played = PLAYLISTS.filter((p) => rows.some((r) => r.playlist === p.id))

  return (
    <>
      <header className="top">
        <h1>RL Tracker</h1>
        <nav>
          {VIEWS.map((name) => (
            <button key={name} aria-pressed={view === name} onClick={() => setView(name)}>
              {name}
            </button>
          ))}
        </nav>
      </header>

      <QuickAdd rows={rows} />

      {entries && !rows.length ? (
        <p className="empty">No entries yet. Log your first one to start tracking.</p>
      ) : (
        <main>
          <nav className="filters">
            <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              All playlists
            </button>
            {played.map((p) => (
              <button key={p.id} aria-pressed={filter === p.id} onClick={() => setFilter(p.id)}>
                {p.name}
              </button>
            ))}
          </nav>
          {view === 'Dashboard' ? (
            <Dashboard rows={rows} visible={visible} onSelect={setFilter} />
          ) : (
            <History rows={visible} onAdd={() => setForm({})} onEdit={(editing) => setForm({ editing })} />
          )}
        </main>
      )}

      {form && <EntryForm entries={rows} editing={form.editing} onClose={() => setForm(undefined)} />}
    </>
  )
}

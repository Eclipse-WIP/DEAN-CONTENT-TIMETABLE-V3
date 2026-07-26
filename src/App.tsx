import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://nzycarfpfantbkowhnmg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eWNhcmZwZmFudGJrb3dobm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5ODEzNzYsImV4cCI6MjEwMDU1NzM3Nn0.Cu-Jhj6hP7IA8pRv0xcRMhvum7IpmDB0QcGeZuUW558'
)

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type Platform = 'tiktok' | 'instagram'

interface Post {
  id: string
  time: string
  type: string
  caption: string
  status: 'planned' | 'ready' | 'posted'
}

interface ScheduleEntry {
  tiktok: Post[]
  instagram: Post[]
}

type Schedule = Record<string, ScheduleEntry>

const STATUS_COLORS = {
  planned: '#6b7280',
  ready: '#f59e0b',
  posted: '#10b981',
}

const STATUS_LABELS = {
  planned: 'PLANNED',
  ready: 'READY',
  posted: 'POSTED',
}

const TT_CONTENT_TYPES = ['Trend Sound', 'Talking Head', 'POV', 'Tutorial', 'Stitch', 'Duet', 'Day in Life', 'Multicam Edit', 'BTS Snippet']
const IG_CONTENT_TYPES = ['Reel', 'Carousel', 'Static Post', 'Story', 'Collab Post', 'IG Live']

const INITIAL_SCHEDULE: Schedule = {
  Monday: {
    tiktok: [{ id: 'tt-m-1', time: '07:00', type: 'Talking Head', caption: 'Morning routine reveal + Q&A answer', status: 'posted' }],
    instagram: [{ id: 'ig-m-1', time: '09:00', type: 'Carousel', caption: '5 tips for staying consistent as a creator', status: 'posted' }],
  },
  Tuesday: {
    tiktok: [{ id: 'tt-t-1', time: '18:00', type: 'Trend Sound', caption: 'Hop on trending audio — behind the scenes cut', status: 'posted' }],
    instagram: [{ id: 'ig-t-1', time: '12:00', type: 'Reel', caption: 'GRWM for the studio day', status: 'ready' }],
  },
  Wednesday: {
    tiktok: [
      { id: 'tt-w-1', time: '09:00', type: 'Tutorial', caption: 'How I edit my videos in 30 min flat', status: 'planned' },
      { id: 'tt-w-2', time: '20:00', type: 'POV', caption: 'POV: You just hit 100k followers', status: 'planned' },
    ],
    instagram: [{ id: 'ig-w-1', time: '11:00', type: 'Static Post', caption: 'Aesthetic desk setup photo dump', status: 'planned' }],
  },
  Thursday: {
    tiktok: [{ id: 'tt-th-1', time: '17:00', type: 'Stitch', caption: 'Stitching that viral productivity hack video', status: 'ready' }],
    instagram: [
      { id: 'ig-th-1', time: '10:00', type: 'Story', caption: 'Poll + product recommendation', status: 'planned' },
      { id: 'ig-th-2', time: '19:00', type: 'Reel', caption: 'Week in my life — Thursday vlog cut', status: 'planned' },
    ],
  },
  Friday: {
    tiktok: [{ id: 'tt-f-1', time: '20:00', type: 'Day in Life', caption: 'Full Friday vlog — coffee, calls, content', status: 'planned' }],
    instagram: [{ id: 'ig-f-1', time: '18:00', type: 'Carousel', caption: 'This week\'s wins + what\'s coming next week', status: 'planned' }],
  },
  Saturday: {
    tiktok: [{ id: 'tt-sa-1', time: '14:00', type: 'Duet', caption: 'Duet with @creativevibez — creator collab', status: 'planned' }],
    instagram: [{ id: 'ig-sa-1', time: '12:00', type: 'Collab Post', caption: 'Partnership drop with @brandname', status: 'planned' }],
  },
  Sunday: {
    tiktok: [],
    instagram: [{ id: 'ig-su-1', time: '16:00', type: 'Story', caption: 'Weekly wrap-up + teaser for next week', status: 'planned' }],
  },
}

function PlatformIcon({ platform }: { platform: Platform }) {
  if (platform === 'tiktok') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function PostCard({
  post,
  platform,
  onStatusChange,
  onDelete,
}: {
  post: Post
  platform: Platform
  onStatusChange: (id: string, status: Post['status']) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const accent = platform === 'tiktok' ? '#fe2c55' : '#e1306c'
  const accentBg = platform === 'tiktok' ? 'rgba(254,44,85,0.08)' : 'rgba(225,48,108,0.08)'

  const statuses: Post['status'][] = ['planned', 'ready', 'posted']

  return (
    <div
      style={{
        background: accentBg,
        border: `1px solid ${accent}22`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 6,
        padding: '10px 12px',
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af', letterSpacing: '0.05em' }}>
          {post.time}
        </span>
        <span
          style={{
            fontSize: 9,
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
            color: STATUS_COLORS[post.status],
            border: `1px solid ${STATUS_COLORS[post.status]}44`,
            borderRadius: 3,
            padding: '1px 5px',
          }}
        >
          {STATUS_LABELS[post.status]}
        </span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#f3f4f6', marginTop: 4, letterSpacing: '0.01em' }}>
        {post.type}
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, lineHeight: 1.4 }}>
        {post.caption}
      </div>

      {expanded && (
        <div
          style={{ marginTop: 10, borderTop: `1px solid ${accent}22`, paddingTop: 10 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'monospace', marginBottom: 6, letterSpacing: '0.08em' }}>
            CHANGE STATUS
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => onStatusChange(post.id, s)}
                style={{
                  fontSize: 9,
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                  padding: '3px 8px',
                  borderRadius: 3,
                  border: `1px solid ${post.status === s ? STATUS_COLORS[s] : '#374151'}`,
                  background: post.status === s ? `${STATUS_COLORS[s]}22` : 'transparent',
                  color: post.status === s ? STATUS_COLORS[s] : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <button
            onClick={() => onDelete(post.id)}
            style={{
              fontSize: 9,
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 3,
              border: '1px solid #374151',
              background: 'transparent',
              color: '#ef4444',
              cursor: 'pointer',
            }}
          >
            REMOVE
          </button>
        </div>
      )}
    </div>
  )
}

function AddPostForm({
  platform,
  onAdd,
  onCancel,
}: {
  platform: Platform
  onAdd: (post: Omit<Post, 'id'>) => void
  onCancel: () => void
}) {
  const [time, setTime] = useState('12:00')
  const [type, setType] = useState('')
  const [caption, setCaption] = useState('')

  const types = platform === 'tiktok' ? TT_CONTENT_TYPES : IG_CONTENT_TYPES
  const accent = platform === 'tiktok' ? '#fe2c55' : '#e1306c'

  const inputStyle = {
    width: '100%',
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: 5,
    padding: '6px 10px',
    color: '#f3f4f6',
    fontSize: 12,
    fontFamily: 'monospace',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div
      style={{
        background: '#111827',
        border: `1px solid ${accent}33`,
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 9, fontFamily: 'monospace', color: '#6b7280', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>TIME</label>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 9, fontFamily: 'monospace', color: '#6b7280', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>CONTENT TYPE</label>
        <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select type…</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 9, fontFamily: 'monospace', color: '#6b7280', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>CAPTION / HOOK</label>
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Write your hook or caption idea…"
          rows={2}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => {
            if (!type || !caption.trim()) return
            onAdd({ time, type, caption, status: 'planned' })
          }}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 5,
            border: 'none',
            background: accent,
            color: '#fff',
            fontSize: 10,
            fontFamily: 'monospace',
            letterSpacing: '0.08em',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ADD POST
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 14px',
            borderRadius: 5,
            border: '1px solid #374151',
            background: 'transparent',
            color: '#6b7280',
            fontSize: 10,
            fontFamily: 'monospace',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [schedule, setSchedule] = useState<Schedule>(INITIAL_SCHEDULE)
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase
      .from('kv_store_a4c6392b')
      .select('value')
      .eq('key', 'content-schedule')
      .maybeSingle()
      .then(({ data }) => { if (data?.value) setSchedule(data.value) })
      .finally(() => setLoading(false))
  }, [])

  const updateSchedule = (next: Schedule) => {
    setSchedule(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase
        .from('kv_store_a4c6392b')
        .upsert({ key: 'content-schedule', value: next })
        .then(() => {})
    }, 600)
  }

  const [adding, setAdding] = useState<{ day: string; platform: Platform } | null>(null)
  const [activeDay, setActiveDay] = useState<string | null>(null)

  const handleStatusChange = (day: string, platform: Platform, id: string, status: Post['status']) => {
    updateSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [platform]: schedule[day][platform].map(p => p.id === id ? { ...p, status } : p),
      },
    })
  }

  const handleDelete = (day: string, platform: Platform, id: string) => {
    updateSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [platform]: schedule[day][platform].filter(p => p.id !== id),
      },
    })
  }

  const handleAdd = (day: string, platform: Platform, post: Omit<Post, 'id'>) => {
    const id = `${platform}-${day}-${Date.now()}`
    updateSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [platform]: [...schedule[day][platform], { ...post, id }].sort((a, b) => a.time.localeCompare(b.time)),
      },
    })
    setAdding(null)
  }

  const totalPosts = DAYS.reduce((acc, d) => {
    const entry = schedule[d]
    return acc + entry.tiktok.length + entry.instagram.length
  }, 0)

  const postedCount = DAYS.reduce((acc, d) => {
    const entry = schedule[d]
    return acc + [...entry.tiktok, ...entry.instagram].filter(p => p.status === 'posted').length
  }, 0)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280', letterSpacing: '0.15em' }}>LOADING SCHEDULE…</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1f2937',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.2em', color: '#6b7280', marginBottom: 6 }}>
            CONTENT SCHEDULE — WEEK VIEW
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Posting <span style={{ color: '#fe2c55' }}>Timetable</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7280', letterSpacing: '0.1em' }}>TOTAL POSTS</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f9fafb' }}>{totalPosts}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7280', letterSpacing: '0.1em' }}>POSTED</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>{postedCount}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7280', letterSpacing: '0.1em' }}>REMAINING</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{totalPosts - postedCount}</div>
          </div>
        </div>
      </div>

      {/* Platform legend */}
      <div style={{ padding: '12px 32px', borderBottom: '1px solid #111827', display: 'flex', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 3, height: 16, background: '#fe2c55', borderRadius: 2 }} />
          <PlatformIcon platform="tiktok" />
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af', letterSpacing: '0.08em' }}>TIKTOK</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 3, height: 16, background: '#e1306c', borderRadius: 2 }} />
          <PlatformIcon platform="instagram" />
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af', letterSpacing: '0.08em' }}>INSTAGRAM</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          {(['posted', 'ready', 'planned'] as const).map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[s] }} />
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7280', letterSpacing: '0.08em' }}>{STATUS_LABELS[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', padding: '0 0 40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `140px repeat(${DAYS.length}, minmax(220px, 1fr))`,
          minWidth: 1600,
        }}>
          {/* Column headers row */}
          <div style={{ background: '#030712', borderBottom: '1px solid #1f2937', padding: '16px 16px' }} />
          {DAYS.map(day => {
            const isToday = day === today
            return (
              <div
                key={day}
                style={{
                  borderBottom: '1px solid #1f2937',
                  borderLeft: '1px solid #1f2937',
                  padding: '16px 12px',
                  background: isToday ? '#0d1117' : '#030712',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
                onClick={() => setActiveDay(activeDay === day ? null : day)}
              >
                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    color: isToday ? '#f9fafb' : '#9ca3af',
                  }}>
                    {day}
                  </div>
                  {isToday && (
                    <div style={{
                      fontSize: 9,
                      fontFamily: 'monospace',
                      letterSpacing: '0.15em',
                      color: '#fe2c55',
                      marginTop: 2,
                    }}>TODAY</div>
                  )}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div style={{
                    fontSize: 10,
                    fontFamily: 'monospace',
                    color: '#4b5563',
                    background: '#111827',
                    borderRadius: 4,
                    padding: '2px 7px',
                  }}>
                    {schedule[day].tiktok.length + schedule[day].instagram.length}
                  </div>
                </div>
              </div>
            )
          })}

          {/* TikTok row */}
          <div style={{
            borderBottom: '1px solid #1f2937',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            background: '#0a0008',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'sticky', top: 0 }}>
              <div style={{ color: '#fe2c55' }}><PlatformIcon platform="tiktok" /></div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.12em', color: '#fe2c55', fontWeight: 700 }}>
                TIKTOK
              </span>
            </div>
          </div>

          {DAYS.map(day => (
            <div
              key={`tt-${day}`}
              style={{
                borderBottom: '1px solid #1f2937',
                borderLeft: '1px solid #1f2937',
                padding: '12px',
                background: '#050008',
                minHeight: 80,
              }}
            >
              {schedule[day].tiktok.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  platform="tiktok"
                  onStatusChange={(id, status) => handleStatusChange(day, 'tiktok', id, status)}
                  onDelete={(id) => handleDelete(day, 'tiktok', id)}
                />
              ))}
              {adding?.day === day && adding?.platform === 'tiktok' ? (
                <AddPostForm
                  platform="tiktok"
                  onAdd={(post) => handleAdd(day, 'tiktok', post)}
                  onCancel={() => setAdding(null)}
                />
              ) : (
                <button
                  onClick={() => setAdding({ day, platform: 'tiktok' })}
                  style={{
                    width: '100%',
                    padding: '6px 0',
                    borderRadius: 5,
                    border: '1px dashed #fe2c5533',
                    background: 'transparent',
                    color: '#fe2c5566',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    ;(e.target as HTMLButtonElement).style.borderColor = '#fe2c5599'
                    ;(e.target as HTMLButtonElement).style.color = '#fe2c55aa'
                  }}
                  onMouseLeave={e => {
                    ;(e.target as HTMLButtonElement).style.borderColor = '#fe2c5533'
                    ;(e.target as HTMLButtonElement).style.color = '#fe2c5566'
                  }}
                >
                  + ADD
                </button>
              )}
            </div>
          ))}

          {/* Instagram row */}
          <div style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            background: '#0a0008',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ color: '#e1306c' }}><PlatformIcon platform="instagram" /></div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.12em', color: '#e1306c', fontWeight: 700 }}>
                INSTAGRAM
              </span>
            </div>
          </div>

          {DAYS.map(day => (
            <div
              key={`ig-${day}`}
              style={{
                borderLeft: '1px solid #1f2937',
                padding: '12px',
                background: '#050005',
                minHeight: 80,
              }}
            >
              {schedule[day].instagram.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  platform="instagram"
                  onStatusChange={(id, status) => handleStatusChange(day, 'instagram', id, status)}
                  onDelete={(id) => handleDelete(day, 'instagram', id)}
                />
              ))}
              {adding?.day === day && adding?.platform === 'instagram' ? (
                <AddPostForm
                  platform="instagram"
                  onAdd={(post) => handleAdd(day, 'instagram', post)}
                  onCancel={() => setAdding(null)}
                />
              ) : (
                <button
                  onClick={() => setAdding({ day, platform: 'instagram' })}
                  style={{
                    width: '100%',
                    padding: '6px 0',
                    borderRadius: 5,
                    border: '1px dashed #e1306c33',
                    background: 'transparent',
                    color: '#e1306c66',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    ;(e.target as HTMLButtonElement).style.borderColor = '#e1306c99'
                    ;(e.target as HTMLButtonElement).style.color = '#e1306caa'
                  }}
                  onMouseLeave={e => {
                    ;(e.target as HTMLButtonElement).style.borderColor = '#e1306c33'
                    ;(e.target as HTMLButtonElement).style.color = '#e1306c66'
                  }}
                >
                  + ADD
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

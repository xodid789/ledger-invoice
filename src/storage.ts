import { supabase } from './lib/supabase'
import type { Hostess, MenuItem, OrderItem, Settings, Space, TcRecord } from './types'

// 2단계: Supabase(Postgres + Realtime)로 데이터를 공유한다.
// 화면 코드(store.tsx)는 storage의 fetch/update/subscribe만 사용한다.

export function newId(): string {
  // crypto.randomUUID()는 보안 컨텍스트(https/localhost)에서만 동작한다.
  // 폰에서 http://LAN-IP 로 열면 undefined라 앱이 죽으므로 폴백을 둔다.
  const c: Crypto | undefined = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  if (c && typeof c.getRandomValues === 'function') {
    const b = c.getRandomValues(new Uint8Array(16))
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    const h = Array.from(b, (x) => x.toString(16).padStart(2, '0'))
    return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const defaultSettings: Settings = {
  venueName: '',
  hourlyRate: 120000,
  roomCharge: 70000,
  hallBarCharge: 50000,
}

// --- DB row <-> 도메인 타입 매핑 (Postgres 컬럼은 snake_case) ---

interface SpaceRow {
  id: string
  label: string
  group: string
  customer: string
  orders: OrderItem[] | null
  tc_log: TcRecord[] | null
  opened_at: number | null
}
const fromSpaceRow = (r: SpaceRow): Space => ({
  id: r.id,
  label: r.label,
  group: r.group,
  customer: r.customer,
  orders: r.orders ?? [],
  tcLog: r.tc_log ?? [],
  openedAt: r.opened_at,
})
const toSpaceRow = (p: Partial<Space>): Record<string, unknown> => {
  const row: Record<string, unknown> = {}
  if (p.label !== undefined) row.label = p.label
  if (p.group !== undefined) row.group = p.group
  if (p.customer !== undefined) row.customer = p.customer
  if (p.orders !== undefined) row.orders = p.orders
  if (p.tcLog !== undefined) row.tc_log = p.tcLog
  if (p.openedAt !== undefined) row.opened_at = p.openedAt
  return row
}

interface HostessRow {
  id: string
  name: string
  working: boolean
  room_id: string | null
  entered_at: number | null
  times: number
}
const fromHostessRow = (r: HostessRow): Hostess => ({
  id: r.id,
  name: r.name,
  working: r.working,
  roomId: r.room_id,
  enteredAt: r.entered_at,
  times: r.times,
})
const toHostessRow = (p: Partial<Hostess>): Record<string, unknown> => {
  const row: Record<string, unknown> = {}
  if (p.id !== undefined) row.id = p.id
  if (p.name !== undefined) row.name = p.name
  if (p.working !== undefined) row.working = p.working
  if (p.roomId !== undefined) row.room_id = p.roomId
  if (p.enteredAt !== undefined) row.entered_at = p.enteredAt
  if (p.times !== undefined) row.times = p.times
  return row
}

interface SettingsRow {
  venue_name: string
  hourly_rate: number
  room_charge: number
  hall_bar_charge: number
}
const fromSettingsRow = (r: SettingsRow): Settings => ({
  venueName: r.venue_name,
  hourlyRate: r.hourly_rate,
  roomCharge: r.room_charge,
  hallBarCharge: r.hall_bar_charge,
})
const toSettingsRow = (s: Settings): Record<string, unknown> => ({
  venue_name: s.venueName,
  hourly_rate: s.hourlyRate,
  room_charge: s.roomCharge,
  hall_bar_charge: s.hallBarCharge,
})

// --- 불러오기 ---

async function fetchSpaces(): Promise<Space[]> {
  const { data, error } = await supabase.from('spaces').select('*').order('label')
  if (error) throw error
  return (data as SpaceRow[]).map(fromSpaceRow)
}

async function fetchHostesses(): Promise<Hostess[]> {
  const { data, error } = await supabase.from('hostesses').select('*')
  if (error) throw error
  return (data as HostessRow[]).map(fromHostessRow)
}

async function fetchMenu(): Promise<MenuItem[]> {
  const { data, error } = await supabase.from('menu').select('*').order('price')
  if (error) throw error
  return data as MenuItem[]
}

async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  return data ? fromSettingsRow(data as SettingsRow) : defaultSettings
}

// --- 쓰기 (실패 시 콘솔에만 기록 — 다른 기기 새로고침/재동기화로 회복됨) ---

async function updateSpace(id: string, patch: Partial<Space>): Promise<void> {
  const { error } = await supabase.from('spaces').update(toSpaceRow(patch)).eq('id', id)
  if (error) console.error('updateSpace', error)
}

async function insertHostess(h: Hostess): Promise<void> {
  const { error } = await supabase.from('hostesses').insert(toHostessRow(h))
  if (error) console.error('insertHostess', error)
}
async function updateHostess(id: string, patch: Partial<Hostess>): Promise<void> {
  const { error } = await supabase.from('hostesses').update(toHostessRow(patch)).eq('id', id)
  if (error) console.error('updateHostess', error)
}
async function deleteHostess(id: string): Promise<void> {
  const { error } = await supabase.from('hostesses').delete().eq('id', id)
  if (error) console.error('deleteHostess', error)
}

async function insertMenuItem(m: MenuItem): Promise<void> {
  const { error } = await supabase.from('menu').insert(m)
  if (error) console.error('insertMenuItem', error)
}
async function updateMenuItem(id: string, patch: Partial<MenuItem>): Promise<void> {
  const { error } = await supabase.from('menu').update(patch).eq('id', id)
  if (error) console.error('updateMenuItem', error)
}
async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from('menu').delete().eq('id', id)
  if (error) console.error('deleteMenuItem', error)
}

async function updateSettings(s: Settings): Promise<void> {
  const { error } = await supabase.from('settings').update(toSettingsRow(s)).eq('id', 1)
  if (error) console.error('updateSettings', error)
}

// --- 실시간 구독 (다른 기기의 변경을 반영) ---

type Unsubscribe = () => void
type ChangeKind = 'upsert' | 'delete'

function subscribeSpaces(onChange: (row: Space, kind: ChangeKind) => void): Unsubscribe {
  const channel = supabase
    .channel('spaces-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'spaces' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onChange(fromSpaceRow(payload.old as SpaceRow), 'delete')
        } else {
          onChange(fromSpaceRow(payload.new as SpaceRow), 'upsert')
        }
      },
    )
    .subscribe()
  return () => void supabase.removeChannel(channel)
}

function subscribeHostesses(onChange: (row: Hostess, kind: ChangeKind) => void): Unsubscribe {
  const channel = supabase
    .channel('hostesses-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'hostesses' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onChange(fromHostessRow(payload.old as HostessRow), 'delete')
        } else {
          onChange(fromHostessRow(payload.new as HostessRow), 'upsert')
        }
      },
    )
    .subscribe()
  return () => void supabase.removeChannel(channel)
}

function subscribeMenu(onChange: (row: MenuItem, kind: ChangeKind) => void): Unsubscribe {
  const channel = supabase
    .channel('menu-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onChange(payload.old as MenuItem, 'delete')
        } else {
          onChange(payload.new as MenuItem, 'upsert')
        }
      },
    )
    .subscribe()
  return () => void supabase.removeChannel(channel)
}

function subscribeSettings(onChange: (settings: Settings) => void): Unsubscribe {
  const channel = supabase
    .channel('settings-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings' },
      (payload) => {
        if (payload.new) onChange(fromSettingsRow(payload.new as SettingsRow))
      },
    )
    .subscribe()
  return () => void supabase.removeChannel(channel)
}

export const storage = {
  fetchSpaces,
  fetchHostesses,
  fetchMenu,
  fetchSettings,
  updateSpace,
  insertHostess,
  updateHostess,
  deleteHostess,
  insertMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateSettings,
  subscribeSpaces,
  subscribeHostesses,
  subscribeMenu,
  subscribeSettings,
}

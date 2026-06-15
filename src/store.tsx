import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Hostess, MenuItem, Settings, Space } from './types'
import { defaultSettings, newId, storage } from './storage'
import { HALF_MS } from './lib/timer'

interface Store {
  now: number // 1초마다 갱신되는 현재 시각(타임어택용)
  spaces: Space[]
  hostesses: Hostess[]
  menu: MenuItem[]
  settings: Settings
  loading: boolean
  // 파생 값
  hostessesIn: (spaceId: string) => Hostess[]
  bottleCount: (space: Space) => number
  drinkTotal: (space: Space) => number // 주대(술)
  hostessTC: (h: Hostess) => number // 아가씨 1명 현재 TC (반타임 반영)
  hostessTimeLabel: (h: Hostess) => string // "반타임" / "1타임" / "1.5타임"
  tcTotal: (space: Space) => number // 방 TC 합 (끝난 기록 + 현재)
  roomFee: (space: Space) => number // 룸티 (사용 중이면 부과, 아니면 0)
  spaceTotal: (space: Space) => number // 주대 + TC + 룸티
  isOccupied: (space: Space) => boolean
  // 공간(방/홀) 동작
  setCustomer: (spaceId: string, name: string) => void
  addOrder: (spaceId: string, menu: MenuItem) => void
  changeQty: (spaceId: string, orderId: string, delta: number) => void
  clearSpace: (spaceId: string) => void
  // 아가씨 동작
  addHostess: (name: string) => void
  removeHostess: (id: string) => void
  toggleWorking: (id: string) => void
  assignRoom: (hostessId: string, roomId: string | null) => void
  extendTime: (hostessId: string) => void // 연장(+1타임, 카운트다운 리셋)
  // 메뉴 / 설정
  updateMenu: (id: string, patch: Partial<MenuItem>) => void
  addMenu: (name: string, abbr: string, price: number) => void
  removeMenu: (id: string) => void
  saveSettings: (s: Settings) => void
}

const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used within StoreProvider')
  return v
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => Date.now())
  const [spaces, setSpaces] = useState<Space[]>([])
  const [hostesses, setHostesses] = useState<Hostess[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // 최초 로드: Supabase에서 전체 데이터를 가져온다.
  useEffect(() => {
    Promise.all([
      storage.fetchSpaces().then(setSpaces),
      storage.fetchHostesses().then(setHostesses),
      storage.fetchMenu().then(setMenu),
      storage.fetchSettings().then(setSettings),
    ])
      .catch((e) => console.error('초기 로드 실패', e))
      .finally(() => setLoading(false))
  }, [])

  // 실시간 구독: 다른 기기에서의 변경을 반영한다.
  useEffect(() => {
    const unsub = storage.subscribeSpaces((row, kind) =>
      setSpaces((prev) =>
        kind === 'delete'
          ? prev.filter((s) => s.id !== row.id)
          : prev.some((s) => s.id === row.id)
            ? prev.map((s) => (s.id === row.id ? row : s))
            : [...prev, row],
      ),
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = storage.subscribeHostesses((row, kind) =>
      setHostesses((prev) =>
        kind === 'delete'
          ? prev.filter((h) => h.id !== row.id)
          : prev.some((h) => h.id === row.id)
            ? prev.map((h) => (h.id === row.id ? row : h))
            : [...prev, row],
      ),
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = storage.subscribeMenu((row, kind) =>
      setMenu((prev) =>
        kind === 'delete'
          ? prev.filter((m) => m.id !== row.id)
          : prev.some((m) => m.id === row.id)
            ? prev.map((m) => (m.id === row.id ? row : m))
            : [...prev, row],
      ),
    )
    return unsub
  }, [])

  useEffect(() => storage.subscribeSettings(setSettings), [])

  const rate = settings.hourlyRate

  // 끝난 블록(연장된 과거)은 풀, 마지막(현재) 블록은 30분 미만이면 반타임.
  const tcAmountAt = (times: number, enteredAt: number | null, at: number) => {
    if (times < 1) return 0
    const elapsedBlock = enteredAt != null ? at - enteredAt : 0
    const last = elapsedBlock < HALF_MS ? Math.round(rate / 2) : rate
    return (times - 1) * rate + last
  }
  const tcLabelAt = (times: number, enteredAt: number | null, at: number) => {
    if (times < 1) return '-'
    const elapsedBlock = enteredAt != null ? at - enteredAt : 0
    const half = elapsedBlock < HALF_MS
    if (half) return times > 1 ? `${times - 1}.5타임` : '반타임'
    return `${times}타임`
  }

  const hostessesIn = (spaceId: string) =>
    hostesses.filter((h) => h.roomId === spaceId)
  const bottleCount = (space: Space) =>
    space.orders.reduce((s, o) => s + o.qty, 0)
  const drinkTotal = (space: Space) =>
    space.orders.reduce((s, o) => s + o.price * o.qty, 0)
  const hostessTC = (h: Hostess) =>
    h.roomId ? tcAmountAt(h.times, h.enteredAt, now) : 0
  const hostessTimeLabel = (h: Hostess) => tcLabelAt(h.times, h.enteredAt, now)
  const tcTotal = (space: Space) =>
    space.tcLog.reduce((s, r) => s + r.amount, 0) +
    hostessesIn(space.id).reduce((s, h) => s + hostessTC(h), 0)
  const isOccupied = (space: Space) =>
    space.customer.trim() !== '' ||
    space.orders.length > 0 ||
    space.tcLog.length > 0 ||
    hostessesIn(space.id).length > 0
  // 룸티: 사용 중이면 자동 부과(세션당 1회 정액). 홀·바는 별도 금액.
  const roomFee = (space: Space) => {
    if (!isOccupied(space)) return 0
    return space.group === '홀' || space.group === '바'
      ? settings.hallBarCharge
      : settings.roomCharge
  }
  const spaceTotal = (space: Space) =>
    drinkTotal(space) + tcTotal(space) + roomFee(space)

  // 아가씨가 방에서 나갈 때 그 시점 TC를 방의 기록(tcLog)에 남긴다.
  const commitTc = (h: Hostess) => {
    if (!h.roomId || h.times < 1) return
    const at = Date.now()
    const amount = tcAmountAt(h.times, h.enteredAt, at)
    const label = tcLabelAt(h.times, h.enteredAt, at)
    const roomId = h.roomId
    const space = spaces.find((s) => s.id === roomId)
    if (!space) return
    const tcLog = [...space.tcLog, { id: newId(), name: h.name, amount, label }]
    setSpaces((prev) => prev.map((s) => (s.id === roomId ? { ...s, tcLog } : s)))
    void storage.updateSpace(roomId, { tcLog })
  }

  const setCustomer = (spaceId: string, name: string) => {
    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...s, customer: name } : s)),
    )
    void storage.updateSpace(spaceId, { customer: name })
  }

  const addOrder = (spaceId: string, m: MenuItem) => {
    const s = spaces.find((x) => x.id === spaceId)
    if (!s) return
    const existing = s.orders.find((o) => o.menuId === m.id)
    const orders = existing
      ? s.orders.map((o) =>
          o.menuId === m.id ? { ...o, qty: o.qty + 1 } : o,
        )
      : [
          ...s.orders,
          { id: newId(), menuId: m.id, name: m.name, price: m.price, qty: 1 },
        ]
    const openedAt = s.openedAt ?? Date.now()
    setSpaces((prev) =>
      prev.map((x) => (x.id === spaceId ? { ...x, orders, openedAt } : x)),
    )
    void storage.updateSpace(spaceId, { orders, openedAt })
  }

  const changeQty = (spaceId: string, orderId: string, delta: number) => {
    const s = spaces.find((x) => x.id === spaceId)
    if (!s) return
    const orders = s.orders
      .map((o) => (o.id === orderId ? { ...o, qty: o.qty + delta } : o))
      .filter((o) => o.qty > 0)
    setSpaces((prev) =>
      prev.map((x) => (x.id === spaceId ? { ...x, orders } : x)),
    )
    void storage.updateSpace(spaceId, { orders })
  }

  const clearSpace = (spaceId: string) => {
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === spaceId
          ? { ...s, customer: '', orders: [], tcLog: [], openedAt: null }
          : s,
      ),
    )
    void storage.updateSpace(spaceId, {
      customer: '',
      orders: [],
      tcLog: [],
      openedAt: null,
    })

    const affected = hostesses.filter((h) => h.roomId === spaceId)
    setHostesses((prev) =>
      prev.map((h) =>
        h.roomId === spaceId
          ? { ...h, roomId: null, enteredAt: null, times: 0 }
          : h,
      ),
    )
    affected.forEach((h) =>
      void storage.updateHostess(h.id, { roomId: null, enteredAt: null, times: 0 }),
    )
  }

  const addHostess = (name: string) => {
    const h: Hostess = {
      id: newId(),
      name: name.trim(),
      working: true,
      roomId: null,
      enteredAt: null,
      times: 0,
    }
    setHostesses((prev) => [...prev, h])
    void storage.insertHostess(h)
  }

  const removeHostess = (id: string) => {
    const h = hostesses.find((x) => x.id === id)
    if (h && h.roomId) commitTc(h) // 방에 있던 채 삭제되면 TC는 방에 남김
    setHostesses((prev) => prev.filter((x) => x.id !== id))
    void storage.deleteHostess(id)
  }

  const toggleWorking = (id: string) => {
    const h = hostesses.find((x) => x.id === id)
    if (!h) return
    if (h.working && h.roomId) commitTc(h) // 퇴근 = 방에서 나감 → TC 확정
    const patch = h.working
      ? { working: false, roomId: null, enteredAt: null, times: 0 }
      : { working: true }
    setHostesses((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    )
    void storage.updateHostess(id, patch)
  }

  const assignRoom = (hostessId: string, roomId: string | null) => {
    const h = hostesses.find((x) => x.id === hostessId)
    if (!h || h.roomId === roomId) return
    if (h.roomId) commitTc(h) // 다른 방/대기로 이동 = 기존 방 TC 확정
    const patch = roomId
      ? { roomId, working: true, enteredAt: Date.now(), times: 1 }
      : { roomId: null, enteredAt: null, times: 0 }
    setHostesses((prev) =>
      prev.map((x) => (x.id === hostessId ? { ...x, ...patch } : x)),
    )
    void storage.updateHostess(hostessId, patch)
  }

  const extendTime = (hostessId: string) => {
    const h = hostesses.find((x) => x.id === hostessId)
    if (!h || !h.roomId) return
    const patch = { times: h.times + 1, enteredAt: Date.now() }
    setHostesses((prev) =>
      prev.map((x) => (x.id === hostessId ? { ...x, ...patch } : x)),
    )
    void storage.updateHostess(hostessId, patch)
  }

  const updateMenu = (id: string, patch: Partial<MenuItem>) => {
    setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
    void storage.updateMenuItem(id, patch)
  }
  const addMenu = (name: string, abbr: string, price: number) => {
    const m: MenuItem = { id: newId(), name, abbr, price }
    setMenu((prev) => [...prev, m])
    void storage.insertMenuItem(m)
  }
  const removeMenu = (id: string) => {
    setMenu((prev) => prev.filter((m) => m.id !== id))
    void storage.deleteMenuItem(id)
  }

  const saveSettings = (s: Settings) => {
    setSettings(s)
    void storage.updateSettings(s)
  }

  const value: Store = {
    now,
    spaces,
    hostesses,
    menu,
    settings,
    loading,
    hostessesIn,
    bottleCount,
    drinkTotal,
    hostessTC,
    hostessTimeLabel,
    tcTotal,
    roomFee,
    spaceTotal,
    isOccupied,
    setCustomer,
    addOrder,
    changeQty,
    clearSpace,
    addHostess,
    removeHostess,
    toggleWorking,
    assignRoom,
    extendTime,
    updateMenu,
    addMenu,
    removeMenu,
    saveSettings,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

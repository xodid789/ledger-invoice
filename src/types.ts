export interface OrderItem {
  id: string
  menuId: string
  name: string // 주문 당시 메뉴명 스냅샷
  price: number // 주문 당시 가격 스냅샷
  qty: number // 병 수
}

// 방에서 끝난(나간) 아가씨의 TC 기록 — 마감 전까지 계산서에 남는다.
export interface TcRecord {
  id: string
  name: string
  amount: number
  label: string // "반타임", "1타임", "1.5타임"
}

export interface Space {
  id: string
  label: string // "401", "홀1", "바1"
  group: string // 표시 구역: 4층 / 5층 / 홀 / 바
  customer: string // 누구 손님 (자유 입력)
  orders: OrderItem[]
  tcLog: TcRecord[] // 끝난 아가씨 TC 누적
  openedAt: number | null // 첫 주문 시각, null이면 빈 곳
}

export interface Hostess {
  id: string
  name: string
  working: boolean // 출근 여부
  roomId: string | null // 현재 들어간 방, null이면 대기
  enteredAt: number | null // 현재 타임 시작 시각 (카운트다운 기준), 연장 시 갱신
  times: number // 누적 타임(시간) 수
}

export interface MenuItem {
  id: string
  name: string
  abbr: string // 현황판 약칭, 예: "골12"
  price: number
}

export interface Settings {
  venueName: string // 업장명 (계산서 상단)
  hourlyRate: number // 아가씨 시간당 요금 (TC), 기본 120000. 반타임은 절반.
  roomCharge: number // 룸티 — 방(4·5층), 기본 70000
  hallBarCharge: number // 룸티 — 홀·바, 기본 50000
  venueOpenedAt: number | null // 오픈 기록 시각
}

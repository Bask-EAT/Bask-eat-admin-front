// src/layout/SettingsLayout.tsx
import React, { useLayoutEffect } from 'react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useTheme } from '@/hooks/useTheme'

// 내비게이션에 표시할 섹션들
const SECTIONS = ['ops', 'search', 'index', 'webhook', 'logs','metrics'] as const
type SectionId = (typeof SECTIONS)[number]

// 화면 표기 라벨 매핑
const LABELS: Record<SectionId, string> = {
  ops: 'Scraper & Uploader',
  search: 'Search',
  index: 'Indexing',
  webhook: 'Webhook',
  logs: 'Logs',
  metrics: 'Metrics',
}

// 헤더 높이(앵커 보정)
const ANCHOR_OFFSET_PX = 72

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  useTheme()

  // ✅ 페인트 전에(최대한 이르게) 자동 스크롤/해시 점프 무력화
  useLayoutEffect(() => {
    // 1) 새로고침/뒤로가기 스크롤 복원 비활성화
    const saved = (history as any).scrollRestoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }

    // 2) 초기 해시가 있으면 네이티브 앵커 점프 발생 전에 제거
    const hash = window.location.hash
    if (hash) {
      const url = window.location.pathname + window.location.search
      history.replaceState(null, '', url)   // 해시 제거
      window.scrollTo(0, 0)                 // 최상단 고정
      // 필요 시: 아래를 켜서, 우리 계산으로 부드럽게 이동 가능
      // queueMicrotask(() => {
      //   const id = decodeURIComponent(hash.slice(1))
      //   smoothScrollToId(id)
      //   history.replaceState(null, '', `${url}#${id}`)
      // })
    }

    // bfcache에서 복귀 시에도 브라우저 복원을 무력화
    const onPageShow = (e: PageTransitionEvent) => {
      // persisted면 캐시에서 복귀 → 기존 스크롤 복원함. 강제로 top으로.
      if ((e as any).persisted) {
        window.scrollTo(0, 0)
      }
    }
    window.addEventListener('pageshow', onPageShow)

    return () => {
      window.removeEventListener('pageshow', onPageShow)
      if ('scrollRestoration' in history) {
        history.scrollRestoration = saved || 'auto'
      }
    }
  }, [])

  // 섹션으로 부드럽게 스크롤
  const go = (id: SectionId) => (e: React.MouseEvent) => {
    e.preventDefault()
    smoothScrollToId(id)
    history.replaceState(null, '', `#${id}`)
  }

  // 항목 클래스: 항상 중립(hover만)
  const itemCls =
    'block px-3 py-2 rounded-md border border-transparent text-muted hover:bg-card hover:border-border hover:text-fg'

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Topbar */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="text-lg font-semibold">Bask:EAT • Admin</div>
          <nav className="hidden md:flex items-center gap-4 text-xs text-muted">
            {SECTIONS.map(id => (
              <a
                key={`top-${id}`}
                href={`#${id}`}
                onClick={go(id)}
                className="hover:text-fg"
              >
                {LABELS[id]}
              </a>
            ))}
            <ThemeToggle />
          </nav>
          {/* 모바일에서도 토글 보이게 (선택) */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="space-y-1 text-sm sticky top-[56px] self-start h-fit">
          <div className="text-muted text-xs font-semibold mb-2">Settings</div>
          {SECTIONS.map(id => (
            <a
              key={`side-${id}`}
              href={`#${id}`}
              onClick={go(id)}
              className={itemCls}
            >
              {LABELS[id]}
            </a>
          ))}
        </aside>

        {/* Main: 헤더 가림 방지 (72px = ANCHOR_OFFSET_PX) */}
        <main className="space-y-6 [&>section]:scroll-mt-[72px]">
          {children}
        </main>
      </div>
    </div>
  )
}

/** helpers */
function getScrollY() {
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  )
}

function smoothScrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const targetY = el.getBoundingClientRect().top + getScrollY() - ANCHOR_OFFSET_PX
  window.scrollTo({ top: Math.max(targetY, 0), behavior: 'smooth' })
}

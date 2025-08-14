import React, { useEffect, useState } from 'react'
import { api, type Status } from '../api'
import { Button, Field } from './ui'
import { Loader2 } from 'lucide-react' 


export default function IndexControl() {
  const [status, setStatus] = useState<Status>()
  const [poll, setPoll] = useState(false)
  const [showLogs, setShowLogs] = useState(true)

  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)

  async function refresh(): Promise<Status | undefined> {
    try { const s = await api.getStatus(); setStatus(s); return s } catch { return undefined }
  }

  useEffect(() => { (async () => { const s = await refresh(); if (s?.running) setPoll(true) })() }, [])
    useEffect(() => {
      if (!poll) return
      const tick = async () => {
        const s = await refresh()
        const st = s?.status
        if (st === 'completed' || st === 'failed' || st === 'stopped') setPoll(false)
      }
      tick()
      const t = setInterval(tick, 3000)
      return () => clearInterval(t)
    }, [poll])
  
    const running = !!status?.running
    const pct = status?.total && status.total > 0
      ? Math.round(((status.progress ?? 0) / status.total) * 100)
      : 0
  
    const statusClass = (() => {
      const s = (status?.status ?? '').toLowerCase()
      if (s.includes('completed')) return 'text-ok border border-border bg-card'
      if (s.includes('failed'))    return 'text-bad border border-border bg-card'
      if (s.includes('stopped'))   return 'text-muted border border-border bg-card'
      if (s.includes('running'))   return 'text-pri border border-border bg-card'
      return 'text-muted border border-border bg-card'
    })()
  
    return (
      <div className="space-y-6">
        {/* 1) 컨트롤 패널 */}
        <div className="rounded-md border border-border overflow-hidden bg-bg">
          <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
            <div className="text-sm font-semibold text-fg flex items-center gap-2">
              인덱싱 제어
              {/* ⬅️ 실행 중/시작 중이면 스피너 표시 */}
              {(running || isStarting) && <Loader2 className="h-4 w-4 animate-spin text-pri" />}
            </div>
            <span className={`text-xs px-2 py-1 rounded ${statusClass}`}>
              {status?.status ?? 'idle'}
            </span>
          </div>
  
          <div className="p-4 space-y-4">
            <Field label="액션" hint="Firestore 인덱싱 시작/중지">
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={running || isStarting}
                  onClick={async () => {
                    try {
                      setIsStarting(true)
                      await api.startIndex()
                      // ⬅️ 낙관적 업데이트: 바로 running으로 점등
                      setStatus(prev => ({ ...(prev ?? {}), status: 'running', running: true }))
                      setPoll(true)
                      await refresh() // 백엔드 상태와 동기화
                    } catch (e) {
                      alert(e)
                    } finally {
                      setIsStarting(false)
                    }
                  }}
                >
                  {isStarting ? (<><Loader2 className="h-4 w-4 animate-spin mr-1" /> 시작 중…</>) : '인덱싱 시작'}
                </Button>
  
                <Button
                  disabled={!running || isStopping}
                  onClick={async () => {
                    try {
                      setIsStopping(true)
                      await api.stopIndex()
                      // ⬅️ 낙관적 업데이트: 바로 stopped로 반영
                      setStatus(prev => ({ ...(prev ?? {}), status: 'stopped', running: false }))
                      setPoll(false)
                      await refresh()
                    } catch (e) {
                      alert(e)
                    } finally {
                      setIsStopping(false)
                    }
                  }}
                >
                  {isStopping ? (<><Loader2 className="h-4 w-4 animate-spin mr-1" /> 중단 중…</>) : '인덱싱 중단'}
                </Button>
  
                <Button onClick={refresh}>상태 새로고침</Button>
  
                <label className="inline-flex items-center gap-2 text-sm text-muted ml-2">
                  <input type="checkbox" checked={poll} onChange={e => setPoll(e.target.checked)} />
                  자동 새로고침(3s)
                </label>
              </div>
            </Field>
  
            <div className="border-t border-border" />
  
            {/* 2) 진행률 패널 */}
            <div className="grid md:grid-cols-[220px_1fr] gap-4">
              <div className="text-sm">
                <div className="text-fg font-medium mb-1">진행률</div>
                <div className="text-xs text-muted">
                  {status?.progress ?? 0} / {status?.total ?? 0}{' '}
                  {status?.total ? `(${pct}%)` : ''}{running ? ' · running' : ''}
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full h-2 bg-border rounded overflow-hidden">
                  <div
                    className="h-full bg-pri transition-all"
                    style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>



      {/* 4) 로그 패널 */}
      <div className="rounded-md border border-border overflow-hidden bg-bg">
        <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-fg">인덱싱 로그</div>
            <div className="text-xs text-muted mt-1">최근 처리 내역 (최대 100개 표시)</div>
          </div>
          <Button onClick={() => setShowLogs(v => !v)}>{showLogs ? '접기' : '펼치기'}</Button>
        </div>

        {showLogs && (
          <div className="p-0">
            <div className="max-h-[320px] overflow-auto font-mono text-[12px] leading-5">
              {(status?.items ?? []).slice(-100).map((x: any, i: number) => {
                const ok = String(x.status).includes('success')
                const bad = String(x.status).includes('failed')
                const tone = ok ? 'text-ok' : bad ? 'text-bad' : 'text-fg'
                return (
                  <div
                    key={i}
                    className={`px-3 py-2 border-b border-border odd:bg-card even:bg-bg ${tone}`}
                  >
                    <span className="text-muted">{x.id}</span>
                    <span className="mx-2">—</span>
                    <span className="truncate inline-block max-w-[50%] align-bottom">{x.product_name ?? ''}</span>
                    <span className="mx-2">::</span>
                    <span>{x.status}</span>
                  </div>
                )
              })}
              {(!status?.items || status.items.length === 0) && (
                <div className="px-3 py-6 text-center text-muted">표시할 로그가 없습니다</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'
import { RotateCw, Copy, Download, Trash2 } from 'lucide-react'
import ButtonGroup from '@/components/ui/ButtonGroup'
import SmallBtn from '@/components/ui/SmallBtn'

type IntervalSec = 0 | 3 | 5 | 10

export default function LogsViewer() {
  const [logs, setLogs] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // 자동 새로고침 간격 (초). 0이면 끔.
  const [auto, setAuto] = useState<IntervalSec>(0)

  // 스크롤 컨테이너
  const boxRef = useRef<HTMLPreElement | null>(null)
  // 초기 1회 스킵용
  const mountedRef = useRef(false)
  // 사용자 하단 추적
  const [autoFollow, setAutoFollow] = useState(true)

  const hasLogs = logs.length > 0

  const refresh = useMemo(
    () => async function refresh() {
      setLoading(true); setError('')
      try {
        const r = await api.getLogs()
        // 서버가 { logs: string[] }를 내려준다고 가정
        const text = (r.logs ?? []).join('\n')
        setLogs(text)
      } catch (e: any) {
        setError(e?.message ?? String(e))
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // 초기에 1회 로드
  useEffect(() => { refresh() }, [refresh])

  // 자동 새로고침
  useEffect(() => {
    if (!auto) return
    const t = setInterval(refresh, auto * 1000)
    return () => clearInterval(t)
  }, [auto, refresh])

  // 컨테이너 스크롤 이벤트로 하단 여부 추적
  const handleScroll = () => {
    const el = boxRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8
    setAutoFollow(nearBottom)
  }

  // logs 변경 시: 초기 마운트는 스킵, 사용자가 하단을 보고 있을 때만 따라가기
  useEffect(() => {
    const el = boxRef.current
    if (!el) return

    if (!mountedRef.current) {
      mountedRef.current = true
      // 초기엔 강제 스크롤하지 않음
      return
    }
    if (!autoFollow) return

    // 레이아웃 반영 뒤 즉시 이동(스무스 금지: trace에 안 찍히게)
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [logs, autoFollow])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(logs)
      alert('복사 완료')
    } catch {
      alert('복사 실패')
    }
  }

  const downloadFile = () => {
    const blob = new Blob([logs], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ✅ 실제 서버 삭제 + 자동 새로고침 레이스 방지
  const handleClear = useCallback(async () => {
    if (!hasLogs) return
    if (!confirm('로그를 정말 삭제할까요? 되돌릴 수 없습니다.')) return

    const prevAuto = auto
    if (auto) setAuto(0) // 자동 새로고침 일시 중지

    setLoading(true); setError('')
    try {
      await api.clearLogs()   // 서버의 로그 파일/저장소를 실제로 비움
      setLogs('')             // 낙관적 UI 반영
      await refresh()         // 서버 상태 재확인(빈 로그)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
      if (prevAuto) setAuto(prevAuto) // 자동 새로고침 복구
    }
  }, [hasLogs, auto, refresh])

  // 하단 고정 토글 버튼(선택)
  const FollowBadge = () => (
    <button
      className="text-xs px-2 py-1 rounded bg-card border border-border"
      onClick={() => setAutoFollow(v => !v)}
      title={autoFollow ? '새 로그가 오면 하단으로 따라갑니다' : '수동 모드'}
    >
      {autoFollow ? 'Following' : 'Follow'}
    </button>
  )

  return (
    <section className="card" id="logs">
      {/* 헤더 */}
      <div className="hdr flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <select
            value={auto}
            onChange={(e) => setAuto(Number(e.target.value) as IntervalSec)}
            className="select !py-1 !px-2 !text-xs w-[120px] shrink-0"
            title="자동 새로고침 간격"
          >
            <option value={0}>Auto: Off</option>
            <option value={3}>Auto: 3s</option>
            <option value={5}>Auto: 5s</option>
            <option value={10}>Auto: 10s</option>
          </select>
          <h2 className="h1 truncate">📜 로그</h2>
        </div>

        <div className="ml-auto max-w-full overflow-x-auto">
          <div className="inline-flex min-w-fit items-center gap-2">
            <FollowBadge />
            <ButtonGroup>
              <SmallBtn variant="primary" onClick={refresh} disabled={loading} className="whitespace-nowrap">
                <RotateCw size={14} /> {loading ? '로딩…' : '갱신'}
              </SmallBtn>
              <SmallBtn onClick={copyToClipboard} disabled={!hasLogs} className="whitespace-nowrap">
                <Copy size={14} /> 복사
              </SmallBtn>
              <SmallBtn onClick={downloadFile} disabled={!hasLogs} className="whitespace-nowrap">
                <Download size={14} /> 저장
              </SmallBtn>
              {/* ⬇️ 실제 삭제 핸들러 연결 */}
              <SmallBtn variant="danger" onClick={handleClear} disabled={!hasLogs} className="whitespace-nowrap">
                <Trash2 size={14} /> 삭제
              </SmallBtn>
            </ButtonGroup>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-bad mt-2">{error}</div>}

      {/* 로그 영역: 한 개의 pre만 사용, 고정 높이/스크롤 가능 */}
      <pre
        ref={boxRef}
        onScroll={handleScroll}
        className="codebox mt-2 h-64 overflow-auto"
      >
        {hasLogs ? logs : (loading ? '불러오는 중…' : '표시할 로그가 없습니다')}
      </pre>
    </section>
  )
}

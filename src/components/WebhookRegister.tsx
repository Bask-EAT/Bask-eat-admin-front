import React, { useCallback, useMemo, useState } from 'react'
import { api } from '../api'
import { Button, Field, TextInput } from './ui'

export default function WebhookRegister() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')      // 검증/요청 에러 메시지
  const [message, setMessage] = useState<string>('')  // 성공 메시지

  // 간단 URL 검증 (http/https만 허용)
  const isValid = useMemo(() => {
    if (!url.trim()) return false
    try {
      const u = new URL(url.trim())
      return u.protocol === 'https:' || u.protocol === 'http:'
    } catch {
      return false
    }
  }, [url])

  const submit = useCallback(async () => {
    if (!isValid) {
      setError('올바른 URL을 입력하세요. (http/https)')
      setMessage('')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const r = await api.registerWebhook(url.trim())
      setMessage(r?.message ?? '웹훅이 등록되었습니다.') 
    } catch (e: any) {
      setError(e?.message ?? '등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [isValid, url])

  return (
    <div className="space-y-3 w-full">
      <Field label="Webhook URL" hint="인덱싱 완료 시 POST 요청을 받을 엔드포인트">
        <div className="grid md:grid-cols-[1fr_140px] gap-3 items-center">
          <TextInput
            placeholder=""
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
            aria-invalid={!isValid && !!url}
            aria-describedby="webhook-help webhook-feedback"
          />
          <Button
            onClick={submit}
            disabled={loading || !isValid}
            className={loading ? 'opacity-70 cursor-wait' : ''}
          >
            {loading ? '등록 중…' : '등록'}
          </Button>
        </div>

        {/* 도움말 / 피드백 영역 */}
        <div id="webhook-help" className="text-xs text-muted mt-1">
          예) https://yourapp.com/api/webhook/index-complete
        </div>
        <div id="webhook-feedback" className="min-h-[1.25rem] mt-1 text-xs" aria-live="polite">
          {error ? (
            <span className="text-bad">{error}</span>
          ) : message ? (
            <span className="text-ok">{message}</span>
          ) : null}
        </div>
      </Field>
    </div>
  )
}

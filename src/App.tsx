import React from 'react'
import SettingsLayout from './layout/SettingsLayout'
import SearchCard from './components/SearchCard'
import IndexControl from './components/IndexControl'
import LogsViewer from './components/LogsViewer'
import WebhookRegister from './components/WebhookRegister'
import { Section } from './components/ui'
import { useScrollInit } from './useScrollInit'   // ✅ 추가
import OpsPanel from '@/components/OpsPanel'

export default function App() {
  useScrollInit(56, 8); // ✅ Topbar h-14(=56px) + 여유 8px

  return (
    <SettingsLayout>
        <Section id="ops" title="Scraper & Uploader" desc="카테고리 저장 · 스크래핑 · 업로드 · 스케줄러">
        <OpsPanel />
      </Section>


      <Section id="search" title="Search" desc="Text / Image / Multimodal Search">
        <SearchCard />
      </Section>

      <Section id="index" title="Indexing" desc="Firestore 인덱싱 작업 시작, 중지 및 모니터링">
        <IndexControl />
      </Section>

      <Section id="webhook" title="Webhook" desc="인덱싱 완료 알림 웹훅 등록">
        <WebhookRegister />
      </Section>

      <Section id="logs" title="Logs" desc="서버 로그 실시간 조회 및 이벤트 확인">
        <LogsViewer />
      </Section>

      
    </SettingsLayout>
  )
}

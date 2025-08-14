# RAG Admin SPA

Vite + React + TailwindCSS 기반의 **백오피스 단일 페이지 앱(SPA)** 입니다.  
멀티모달 RAG 백엔드(검색/인덱싱)와 **운영용 FastAPI(OPS: 카테고리·스크래핑·업로드·스케줄러)**를 한 화면에서 제어/모니터링합니다.

> 이 README는 업로드된 압축 파일(`rag-admin-spa.zip`)의 실제 내용을 분석해 작성되었습니다. 불일치가 있으면 알려주세요.

---

## 🔧 기술 스택
- **React 18**, **Vite 7**, **TypeScript 5**
- **TailwindCSS 3**, 커스텀 다크/라이트 테마
- **lucide-react** 아이콘
- 경로 별칭: `@ → ./src`

## 📦 디렉터리 구조(요약)

```
src/
  └─ App.tsx
  └─ api.ts
  └─ main.tsx
  └─ styles.css
  └─ useScrollInit.ts
src/components/
  └─ IndexControl.tsx
  └─ LogsViewer.tsx
  └─ OpsPanel.tsx
  └─ ResultsList.tsx
  └─ SearchCard.tsx
  └─ ThemeToggle.tsx
  └─ WebhookRegister.tsx
  └─ ui.tsx
  └─ ui/ButtonGroup.tsx
  └─ ui/SmallBtn.tsx
src/hooks/
  └─ useTheme.ts
src/layout/
  └─ SettingsLayout.tsx
```

> 압축에는 `node_modules/`가 포함되어 있지만, **VCS에는 올리지 않는 것을 권장**합니다.

---

## 🚀 빠른 시작

### 1) 요구사항
- **Node.js ≥ 18** (권장: 20 LTS)
- npm

### 2) 설치 & 실행
```bash
npm i
npm run dev         # 개발 서버 (Vite, 기본 http://localhost:5173)
npm run build       # 프로덕션 빌드 (dist/)
npm run preview     # 빌드 미리보기
```

루트에 포함된 `명령어.txt`에도 `npm run dev`가 안내되어 있습니다.

---

## ⚙️ 환경 변수(.env)

현재 `.env` 기본값:
```
VITE_API_BASE=http://localhost:8000
VITE_OPS_BASE=http://localhost:8420
```

프론트엔드는 다음 규칙으로 백엔드 주소를 결정합니다.

- `VITE_API_BASE`가 정의되면 → `http(s)://.../search/*`, `/index/*` 같은 **절대 URL**로 호출
- 정의되지 않으면 → **상대 경로**(`/search`, `/index`, `/api` 등)로 호출하며, 개발 모드에서는 **Vite 프록시**가 동작

### 개발용 프록시(vite.config.ts)
다음 경로가 프록시로 매핑됩니다(발췌):
```
proxy: {
'/search': 'http://localhost:8000',
'/index': 'http://localhost:8000',
'/health': 'http://localhost:8000',
'/api': {
target: 'http://localhost:8000',
// -> http://localhost:8420/save_categories 로 전달됩니다.
'/ops': {
target: 'http://localhost:8420',
```
- 기본 백엔드(**검색/인덱싱/헬스체크**): `http://localhost:8000`
  - `/search`, `/index`, `/health`, `/api`
- **OPS 백엔드**(카테고리/스크래핑/업로드/스케줄러): `http://localhost:8420`
  - `/ops/*` → `http://localhost:8420/*` 로 rewrite

> 운영 배포 시에는 프록시 대신 **환경변수로 절대 URL**을 지정하는 것을 권장합니다.

---

## 🧩 주요 화면 & 기능

### 1) **Scraper & Uploader (OPS 패널)**
- **카테고리 관리**: `categories.json` 불러오기/저장/삭제
- **.env 저장**: `EMART_START_PAGE`, `EMART_END_PAGE`, `EMB_SERVER` (임베딩 서버 URL)
- **수동 실행(스크래핑)**: 전체 / 가격 / 비가격 / 이미지
- **업로드(Firebase)**: 전체 / 가격 / 기타
- **스케줄러**: On/Off/Status, 작업 일시정지/재개(취소 플래그), 크론 시간 설정 및 즉시 실행

### 2) **Search**
- **텍스트 검색**: `query`, `top_k`
- **이미지 검색**: 업로드 파일, `top_k`
- **멀티모달 검색**: `query` + 파일 + `alpha`(가중치), `top_k`
- 결과 목록/썸네일/유사도 점수 표시(없으면 `-`)

### 3) **Indexing**
- **인덱싱 제어**: 시작/중지
- **상태 조회**: 진행률(`progress/total`), 실행 여부(`running`), 취소 요청 여부 등
- **로그 뷰어**: 실시간 새로고침 간격 선택, 하단 따라가기, 복사/다운로드/비우기

### 4) **Webhook**
- 인덱싱 완료 알림을 받을 **웹훅 URL 등록** (http/https만 허용)

### 5) **레이아웃/테마**
- 상단 고정 내비(섹션: `ops`, `search`, `index`, `webhook`, `logs`)
- 라이트/다크 토글, CSS 변수 기반 테마

---

## 🛰️ API 요약(프론트에서 기대하는 엔드포인트)

아래는 `src/api.ts` 기준 **프론트엔드가 호출하는 경로**입니다. 실제 백엔드는 동일 스펙을 만족해야 합니다.

- **search**
  - `/search/text (POST, { query, top_k })`
  - ` /search/image (POST, FormData[file, top_k])`
  - ` /search/multimodal (POST, FormData[query, file, alpha, top_k])`
- **index**
  - `/index/start (POST)`
  - ` /index/stop (POST)`
  - ` /index/status (GET -> Status)`
  - ` /index/logs (GET -> { logs: string[] })`
  - ` /index/logs (DELETE)`
  - ` /index/webhook (POST FormData[url])`
- **ops**
  - `/categories (GET)`
  - ` /save_categories (POST)`
  - ` /delete_categories (DELETE)`
  - ` /save_env (POST, { EMART_START_PAGE?, EMART_END_PAGE?, EMB_SERVER? })`
  - ` /run_json (POST)`
  - ` /run_price_json (POST)`
  - ` /run_non_price_json (POST)`
  - ` /run_image (POST)`
  - ` /run_firebase_all (POST)`
  - ` /run_firebase_price (POST)`
  - ` /run_firebase_other (POST)`
  - ` /scheduler/on (POST)`
  - ` /scheduler/off (POST)`
  - ` /scheduler/status (GET -> SchedulerStatus)`
  - ` /tasks/status (GET -> TaskFlag)`
  - ` /tasks/stop (POST)`
  - ` /tasks/start (POST)`
  - ` /scheduler/config (GET/POST -> SchedulerConfig)`
  - ` /scheduler/run-now?which=all|price (POST)`

#### 타입(요약)
- **ProductResult**: `id`, `product_name?`, `category?`, `image_url?`, `product_address?`, `quantity?`, `out_of_stock?`, `last_updated?`, `is_emb?`, `similarity_score?`, `price?`, `last_price_updated?`, `price_history?[]`
- **SearchResponse**: `{ results: ProductResult[] }`
- **Status**: `{ status?, progress?, total?, items?, running?, cancel_requested? }`
- **SchedulerStatus**: `{ status?, running?, paused?, stopped?, state?, message?, error? }`
- **TaskFlag**: `{ status?, cancelled?, message?, error? }`
- **SchedulerConfig**: `{ status?, timezone?, all?: {type?, hour?, minute?, next_run_time?}, price?: {...} }`

> 모든 요청은 `fetch` 기반으로 구성되어 있으며, 기본값으로 쿠키 인증은 끄여 있습니다(`USE_CREDENTIALS=false`). 필요 시 `api.ts`에서 조정하세요.

---

## 🛠️ 개발 메모

- 경로 별칭: `import x from '@/...'` → `src/` 기준
- 스타일: `src/styles.css`에 라이트/다크 팔레트가 **CSS 변수**로 정의되어 있고, Tailwind `darkMode:'class'`를 사용합니다.
- 스크롤 초기화/앵커: `index.html` + `useScrollInit` 훅으로 상단 바 높이를 고려한 섹션 스크롤을 구현했습니다.
- 로그 다운로드/복사 등은 브라우저 API(Blob/Clipboard)를 활용합니다.
- 윈도우/유닉스 줄바꿈 혼재 시 불필요한 diff가 생길 수 있으므로 LF 고정을 권장합니다(`.gitattributes`/`.editorconfig` 사용).

---

## 📦 빌드 & 배포

- `npm run build` → `dist/` 정적 파일 생성
- 정적 호스팅(Nginx/S3/CloudFront 등)에 업로드하고, **백엔드 URL은 빌드 전 `.env` 에서 설정**하세요.
- 개발 프록시는 Vite 개발 서버에서만 동작합니다. 운영에서는 프록시 없이 백엔드 CORS/리버스프록시 설정을 적용하세요.

---

## ✅ 체크리스트

- [ ] `.env`의 `VITE_API_BASE` / `VITE_OPS_BASE` 확인
- [ ] 백엔드(8000)와 OPS(8420) 기동
- [ ] 텍스트/이미지/멀티모달 검색 테스트
- [ ] 인덱싱 시작/중지 & 로그 수집 확인
- [ ] 카테고리 저장/삭제, 스케줄러 설정/즉시 실행 동작 확인
- [ ] 웹훅 URL 등록 및 통지 수신 여부 확인

---

## 라이선스
사내/개인 프로젝트 기본 템플릿으로 제공되며, 별도 라이선스가 명시되지 않은 의존성은 각 패키지의 라이선스를 따릅니다.

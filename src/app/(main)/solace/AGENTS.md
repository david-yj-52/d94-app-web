# L3 · 화면: Solace 메시징 🧪

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 solace**
> 관련 L2: [lib/messaging/solace](../../../lib/AGENTS.md)

## 개요
- **URL:** `/solace` · **파일:** `page.tsx` (12줄), `solaceTestContent.tsx` (210줄)
- **실험 주제:** Solace PubSub+ 브로커와 **WebSocket(solclientjs)** 으로 요청·응답 메시징을 합니다.
- `page.tsx`는 `dynamic(() => import("./solaceTestContent"), {ssr: false})`로 클라이언트에서만 로드합니다. solclientjs는 브라우저 전용이고, `next.config.mjs`의 `serverExternalPackages`에도 등록되어 있습니다.
- 인증 보호가 없습니다. 헤더나 허브 메뉴에도 없어 URL로 직접 접근합니다.

## 화면 구성
```
solace/page.tsx → (dynamic, ssr:false) solaceTestContent.tsx
├── 헤더: 연결 상태 점(isConnected/isConnecting) + 연결/해제 버튼
├── 메시지 목록 (새 메시지 시 자동 스크롤)
└── 입력창 + 전송 (Enter 전송, Shift+Enter 줄바꿈) + 메시지 지우기
```
다크 테마(`bg-gray-950`)로, 앱의 다른 화면과 스타일이 다릅니다.

## 데이터
- `useSolace()` → `{isConnected, isConnecting, messages, error, connect, publish, disconnect, clearMessages}`
- 설정은 `lib/messaging/solace/solaceConfig.ts`에 있습니다: `ws://localhost:8008`, VPN `TSH`, 응답 토픽 `TET/REP/user-1`.

## 기능 (L4)
### 연결
- `connect()`로 세션을 만들고 응답 토픽을 구독합니다. 오류는 `error`로 표시합니다.
### 발행
- `publish(text)`로 메시지를 보냅니다. 전송 중에는 `isSending`으로 중복 전송을 막습니다.

## 주의·예외
- 접속 정보(admin/admin)가 하드코딩되어 있고, env 변수는 쓰지 않습니다 → [known-issues](../../../../docs/known-issues.md)
- 실행하려면 로컬에 Solace 브로커(WebSocket 8008 포트)가 필요합니다.

# L2 · layout 컴포넌트

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **layout**
> 사용처: `src/app/layout.tsx` (모든 화면 공통). 로그인한 경우에만 렌더링됩니다.

### ApHeader — `@/components/layout/ApHeader`
```ts
{ user: any }   // ⚠️ any — session.user 타입(Session["user"])으로 바꿔야 함
```
- 상단 고정 헤더입니다. 구성은 로고(→ `/home`), 메뉴 `NAV_ITEMS`, `GlobalSearch`, `NotificationBell`, 사용자 영역입니다.
- 메뉴는 홈, 프로젝트, Tasks(`/todo`), MPMS입니다. **새 실험 모듈을 헤더에 노출하려면 `NAV_ITEMS`에 추가**하세요.

### GlobalSearch — `@/components/layout/GlobalSearch` (ApHeader 내부)
- props가 없습니다. **Ctrl/⌘+K**를 누르면 열리고 ESC를 누르면 닫힙니다. 입력은 debounce한 뒤 `searchIssues`를 호출하고, 결과를 클릭하면 이슈로 이동합니다.
- ⚠️ 훅 없이 `lib/api/search`를 직접 호출합니다(규칙 예외).

### NotificationBell — `@/components/layout/NotificationBell` (ApHeader 내부)
- props가 없습니다. 읽지 않은 알림 수를 60초마다 폴링합니다(`["notifications-unread-count"]`). 드롭다운을 열면 최근 10건을 조회하고, 클릭하면 해당 이슈로 이동합니다.
- ⚠️ 컴포넌트 안에서 `useQuery`와 `lib/api/notifications`를 직접 사용합니다(규칙 예외).

### NotificationMount — `@/components/layout/NotificationMount`
- props가 없습니다. `useNotifications()`로 SSE(`NEXT_PUBLIC_BACKEND_URL/api/v1/notifications/subscribe`)를 구독합니다. 알림이 오면 토스트를 띄웁니다.
- 화면을 그리지 않는 "마운트용" 컴포넌트입니다. 루트 layout에 한 번만 둡니다.

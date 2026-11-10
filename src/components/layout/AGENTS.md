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
- 배지는 99 초과면 `99+`, 0 이면 숨김. 안 읽은 알림을 누르면 읽음 처리 후 `issueKey` 가 있을 때 `/cira/search?q={issueKey}` 로 갑니다. "모두 읽음"은 `["notifications"]`·`["notifications-unread-count"]` 를 무효화합니다(`NotificationBell.test.tsx`, 백엔드 응답 모양으로 검증).

### NotificationMount — `@/components/layout/NotificationMount`
- props가 없습니다. `useNotifications()`로 최근 알림을 30초마다 폴링하고(`["notifications", "recent"]`, `/api/proxy` 경유), 처음 보는 안 읽은 알림이 있으면 토스트를 띄웁니다.
- 화면을 그리지 않는 "마운트용" 컴포넌트입니다. 루트 layout에 한 번만 둡니다.

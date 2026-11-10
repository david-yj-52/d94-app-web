# ADR 0006 · CIRA 전용 레이아웃과 디자인 계층

- 날짜: 2026-11-09
- 상태: 채택
- 관련: [재디자인 스펙](../superpowers/specs/2026-11-09-cira-jira-cloud-redesign-design.md)

## 배경

CIRA 를 팀의 Jira 대용으로 쓰려면 Jira Cloud 식 레이아웃(통합 사이드바 + 얇은 상단 바)이 필요합니다. 그런데 이 앱은 여러 실험 모듈이 루트 layout 의 `ApHeader` 와 `components/ui` 토큰을 공유합니다. CIRA 디자인을 그 위에 얹으면 다른 모듈 화면과 충돌합니다.

## 결정

1. **라우트 분리:** CIRA 화면은 `src/app/(cira)/cira/**`(URL `/cira/**`)에 둡니다. 루트 layout 은 Providers 만 갖고, 기존 헤더는 `(main)/layout.tsx`, CIRA 셸은 `(cira)/cira/layout.tsx` 가 그립니다. 세션(next-auth)은 루트 Providers 를 공유하므로 로그인은 그대로 유지됩니다. 예전 경로는 `next.config.mjs` redirect 로 옮깁니다.
2. **CIRA 전용 계층:** `components/cira/ui`(primitive)와 `components/cira/shell`(셸)을 둡니다. L1 §5 의 `ui/` 대신 이곳에 두는 이유는 CIRA 디자인을 다른 모듈과 공유하지 않기 때문입니다. 의존 방향은 CIRA Screen → Domain(board·issue·sprint 등) → `cira/ui` → `ui` 이고, CIRA 가 아닌 모듈은 `components/cira/**` 를 import 하지 않습니다.
3. **토큰:** `.cira-root` 범위 CSS 변수 + Tailwind `cira.*` 색. `.cira-root` 밖(기존 화면)에서는 값이 없으므로 섞이지 않습니다.
4. **헤드리스 컴포넌트:** 드롭다운·모달은 Radix(`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`)로 키보드·포커스·바깥 클릭을 처리하고 스타일은 토큰으로 입힙니다. 접기(Collapsible)는 `<details>`, 툴팁은 `title` 로 충분해서 패키지를 늘리지 않습니다.
5. **사이드바 상태:** `localStorage` 직접 접근 금지 규칙에 따라 쿠키 `cira_sidebar_collapsed`(path `/cira`)에 둡니다. 서버 layout 이 읽으므로 첫 렌더부터 폭이 맞습니다.

## 결과

- 기존 모듈 화면은 바뀌지 않습니다. `ProjectNav` 는 셸 사이드바가 대신하여 삭제했습니다.
- CIRA 화면의 새 UI 는 `components/cira` 카드([AGENTS](../../src/components/cira/AGENTS.md))를 먼저 확인합니다.

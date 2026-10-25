# 알려진 문제 · 기술 부채

발견 시점: 2026-10-15. 해결하면 이 목록에서 지우고, 필요하면 ADR을 남기세요.

## 도구 · 품질
- **린트 미동작**: Next 16에서 `next lint`가 제거되었고 `eslint.config.*`도 없습니다. `eslint`와 `eslint-config-next`는 설치되어 있습니다. → flat config를 추가하고 `"lint": "eslint ."`로 바꿔야 합니다.
- **테스트 없음**: 테스트 프레임워크, 테스트 파일, CI가 모두 없습니다. 지금은 `tsc --noEmit`과 `build`가 유일한 검증 수단입니다.
- **포맷터 설정 없음**: IDE 포맷에 의존합니다. Prettier나 `.editorconfig`를 도입하면 도구에 상관없이 같은 결과가 나옵니다.
- **`tsconfig.json`**: `.next\\dev/types` include 항목이 중복되어 있습니다(Windows 경로 흔적).
- **`.gitignore`**: `*.tsbuildinfo`가 빠져 있습니다.
- **`package.json`**: `npm init`에서 남은 필드(`main`, `license: ISC`)가 그대로 있습니다.

## 코드
- **`src/middleware.ts`**: Next 16에서 이 파일명 규칙이 `proxy.ts`로 바뀌었습니다(deprecated, 아직 동작). 이름을 바꿀 때 `api/proxy` 라우트와 혼동하지 않도록 주의하세요.
- **임시 우회 장치**(`TODO: 임시`): `DEV_ADMIN_LOGIN`(`src/auth.ts`), `DEV_MOCK_API`(`src/lib/mock/`). 백엔드가 안정되면 제거할지, 개발용 기능으로 정식화할지 결정해야 합니다. ⚠️ `DEV_ADMIN_LOGIN`은 production에서도 동작하므로, Vercel에 설정돼 있으면 배포 사이트에 누구나 admin/admin으로 로그인할 수 있습니다.
- **`src/lib/mock/`**와 **`.env.sample`**이 git에 추적되지 않습니다(untracked). 팀원과 공유하려면 커밋이 필요합니다.
- **Solace 설정 하드코딩**: `src/lib/messaging/solace/solaceConfig.ts`에 `ws://localhost:8008`, admin/admin이 들어 있고 환경 변수를 무시합니다.
- **프록시 로그**: `src/app/api/proxy/[...path]/route.ts`가 모든 요청 URL을 `console.log`로 출력합니다.
- **API 레이어 이중화**: `src/lib/api/*`(axios)와 todo 실험용 `src/lib/api.ts`(fetch)가 공존합니다.
- **보호 경로**: `/home`, `/todo`는 페이지에서 `auth()`로 직접 확인합니다. `/mpms`, `/solace`는 보호되지 않습니다. 의도한 것인지 확인이 필요합니다.
- **`/` 경로 중복**: `src/app/page.tsx`(→ `/todo`)와 `src/app/(main)/page.tsx`(→ `/projects`)가 같은 URL `/`를 가집니다. `next build`는 오류 없이 통과하지만(2026-10-15 확인) 실제로는 둘 중 하나만 서빙됩니다. 의도를 정해 하나를 제거하세요.
- **todo 목록 하드코딩**: `src/app/actions.ts`의 `getTodos`가 고정 배열을 반환합니다.
- **미사용 컴포넌트**: `AuthCheck`, `LoginButton`, `AgentStatusButton`
- **공통 UI primitive 부재**: 모달 21곳과 버튼 171곳을 직접 마크업합니다. 승격 계획은 [ui/AGENTS.md §4](../src/components/ui/AGENTS.md)에 있습니다.
- **비대한 페이지**와 **규칙 예외 파일**: [conventions.md §7](conventions.md#7-알려진-예외-따라-하지-말-것), [src/app/AGENTS.md §4](../src/app/AGENTS.md)

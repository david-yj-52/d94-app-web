# L3 · 화면: 기준정보

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 settings**

## 개요
- **URL:** `/settings?group={id}` (없거나 모르는 id 면 `general`) · **접근:** 보호 경로(`routeAccess.ts`)
- **목적:** 전체(테넌트) 공통 기준정보. Mac 시스템 설정처럼 왼쪽 그룹 목록 + 오른쪽 그룹 설정. 조회는 누구나, 변경은 ADMIN(`GS_USER_ROLE`)만.
- **진입:** 헤더 `ApHeader` 의 [기준정보] 링크(ADMIN 에게만 보임). ADMIN 이 아니어도 URL 로 들어오면 읽기 전용.
- 설계: d94-note `docs/superpowers/specs/2026-11-20-reference-settings-design.md`

## 화면 구성
| 파일 | 내용 |
|---|---|
| `page.tsx` | `SettingsNav`(왼쪽) + 그룹 머리 카드(아이콘·이름·설명) + 패널. `general` → `GeneralSettingsPanel readOnly={!useIsAdmin()}`, `ayaan` → `AyaanSettingsPanel`, `api-tokens` → `ApiTokenSettingsPanel isAdmin={useIsAdmin()}`, 그 밖 → `EmptyGroupPanel`. `useSearchParams` 때문에 `Suspense` 로 감쌈 |
| `groups.ts` | `SETTING_GROUPS`: general · cira · mpms · todo(Tasks) · solace · interface-test · study · ayaan · api-tokens, `DEFAULT_GROUP = "general"` |

## 데이터
- `useSettings()` `["settings"]`, `useUpdateSettings()`(성공 시 `setQueryData`), `useIsAdmin()` ← `useMe()` `["users", "me"]` (`hooks/useSettings.ts`)
- API: `GET/PUT /v1/settings` → d94-query `SettingController` (PUT 은 `hasRole('ADMIN')`, 아니면 403). 허용 키·검증은 `SettingService`

## 기능
- **그룹 추가:** 새 기능(서비스)이 생기면 `groups.ts` 에 그룹을 넣고, 설정 항목이 생기면 `components/settings/` 에 패널을 만들어 `page.tsx` 에서 분기합니다. 새 키는 d94-query `SettingService` 허용 목록에도 추가해야 저장됩니다.
- **General 로고:** 글자(1~30자, trim) + 폰트(`ui/logoFonts`) + 미리보기. 저장하면 `["settings"]` 캐시가 바뀌어 같은 탭의 헤더 로고가 바로 바뀝니다.
- **Ayaan:** 전역 정책·Tool·작업공간 탭 (`AyaanSettingsPanel`; 작업공간은 저장소 목록(repos) 편집, `?tab=workspace&projectKey=<key>` 로 탭·새 폼을 바로 연다). ayaan API(`/v1/ayaan/**`) 경유이고 값 검증은 ayaan. 전역 정책은 `SN_SETTING` 의 `ayaan.*` 키(d94-query V545 이관), Tool·작업공간은 `SN_AYN_TOOL`·`SN_AYN_WORKSPACE`. `/v1/settings` PUT 은 `ayaan.*` 키를 받지 않는다(허용 목록 밖). 변경 권한은 ayaan `AYAAN_JWT_ALLOWED_SUBJECTS`. 옛 주소 `/ayaan/settings` 는 redirect.
- **API 토큰:** MCP·AI 도구용 개인 토큰. 서비스는 백엔드 `GET /v1/api-tokens/services` 순서대로(전체(전역)·CIRA·Docs·Study·인터페이스 테스트, 이름은 `types/apiToken.serviceLabel`). 발급 기본 선택은 전역이 아닌 첫 서비스이고, 전역을 고르면 경고 문구가 뜬다. 서비스별 허용 토글(ADMIN 만 변경, `PUT /v1/api-tokens/services/{service}`) + 내 토큰 발급(이름·서비스·읽기 전용/읽기·쓰기·30/90/365일)·목록(prefix·만료·마지막 사용)·폐기(`window.confirm`). 원문은 발급 직후 한 번만 노란 상자에 보이고 [확인했습니다] 를 누르면 사라진다. 토큰 관리 API 는 JWT 로만 호출된다(d94-query 가 API 토큰으로는 403). 설계: d94-note `feature/user/3_api_token/api-token-plan.md`

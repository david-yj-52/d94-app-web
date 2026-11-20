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
| `page.tsx` | `SettingsNav`(왼쪽) + 그룹 머리 카드(아이콘·이름·설명) + 패널. `general` → `GeneralSettingsPanel readOnly={!useIsAdmin()}`, 그 밖 → `EmptyGroupPanel`. `useSearchParams` 때문에 `Suspense` 로 감쌈 |
| `groups.ts` | `SETTING_GROUPS`: general · cira · mpms · todo(Tasks) · solace · interface-test · study · ayaan(`link: "/ayaan/settings"`), `DEFAULT_GROUP = "general"` |

## 데이터
- `useSettings()` `["settings"]`, `useUpdateSettings()`(성공 시 `setQueryData`), `useIsAdmin()` ← `useMe()` `["users", "me"]` (`hooks/useSettings.ts`)
- API: `GET/PUT /v1/settings` → d94-query `SettingController` (PUT 은 `hasRole('ADMIN')`, 아니면 403). 허용 키·검증은 `SettingService`

## 기능
- **그룹 추가:** 새 기능(서비스)이 생기면 `groups.ts` 에 그룹을 넣고, 설정 항목이 생기면 `components/settings/` 에 패널을 만들어 `page.tsx` 에서 분기합니다. 새 키는 d94-query `SettingService` 허용 목록에도 추가해야 저장됩니다.
- **General 로고:** 글자(1~30자, trim) + 폰트(`ui/logoFonts`) + 미리보기. 저장하면 `["settings"]` 캐시가 바뀌어 같은 탭의 헤더 로고가 바로 바뀝니다.

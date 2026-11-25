# L2 · settings 컴포넌트 (기준정보)

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **settings**
> 사용처: `src/app/(main)/settings/page.tsx`

### SettingsNav — `@/components/settings/SettingsNav`
```ts
{ groups: SettingGroup[]; activeId: string; onSelect: (id: string) => void }
```
- 왼쪽 그룹 목록. 위쪽 검색 입력으로 `label` 을 필터합니다. 선택 항목은 `bg-blue-600`.

### GeneralSettingsPanel — `@/components/settings/GeneralSettingsPanel`
```ts
{ readOnly: boolean }
```
- `useSettings` 로 불러온 뒤 로고 글자 input(최대 30자)·폰트 select(`LOGO_FONTS`)·미리보기·[저장]. 공백뿐이거나 30자 초과면 저장 비활성.
- 저장 = `useUpdateSettings().mutate({general.logo.text, general.logo.font})`. 성공·실패는 `useToast`.
- `readOnly` 면 입력·버튼 비활성 + "관리자만 변경할 수 있습니다." 안내.

### CiraSettingsPanel — `@/components/settings/CiraSettingsPanel`
```ts
{ readOnly: boolean }
```
- 탭 [프로젝트 타입] [사용자 정의 필드]. 프로젝트 타입: 왼쪽 타입 목록(쓰는 프로젝트 수)·추가, 오른쪽 선택 타입의 이름 변경·삭제(쓰는 프로젝트가 있으면 막음)와 필드 세트(고정 4개 잠김 + 필드별 기본 표시·위/아래·빼기·[+ 필드 추가]). 바꾸면 바로 저장되고 그 타입의 기존 프로젝트에도 반영됩니다.
- 사용자 정의 필드: 전역 필드 목록·생성·수정(`CustomFieldModal`)·삭제(확인 창에 `useFieldUsage` 의 "N개 프로젝트, M개 Task").
- 데이터 `hooks/useFields`, `readOnly` 면 편집 UI 를 숨깁니다(ADMIN 판단은 `useIsAdmin`, 권한 검사는 백엔드).

### CustomFieldModal — `@/components/settings/CustomFieldModal`
```ts
{ editTarget?: FieldDef | null; onSubmit: (data: SaveCustomField) => void; isPending?: boolean; onClose: () => void }
```
- 이름(1~100자)·필드 타입(수정 때는 바꿀 수 없음)·선택지(선택형·다중 선택, 한 줄에 하나)·필수 여부. 저장은 부모가 `onSubmit` 으로(전역 = CiraSettingsPanel, 프로젝트 = `settings/fields` 화면).

### AyaanSettingsPanel — `@/components/settings/AyaanSettingsPanel`
- props 없음. 탭(전역 정책/Tool/작업공간), 입력마다 `HelpCard`, 서버 422 메시지를 필드 옆에 표시. API `@/lib/api/ayaan`, 검증·변환 헬퍼는 `app/(main)/ayaan/settings/{validate,toolBody}.ts`.

### ApiTokenSettingsPanel — `@/components/settings/ApiTokenSettingsPanel`
```ts
{ isAdmin: boolean }
```
- 서비스 이름은 `serviceLabel`, 전역 토큰 코드는 `GLOBAL_TOKEN_SERVICE`("all"). 발급 직후 MCP 예시 경로는 서비스별(`EXAMPLE_PATH`).
- 위: 서비스별 허용 체크박스(`isAdmin` 아니면 비활성 + 안내). 아래: 발급 폼(이름 1~100자, 허용된 서비스만, 권한, 만료) → 원문 1회 표시(복사·MCP 예시) → 목록·폐기.
- 데이터 `hooks/useApiTokens` (`["apiTokens"]`, `["apiTokens","services"]`), API `@/lib/api/apiTokens`, 타입 `@/types/apiToken`, mock `lib/mock/apiToken.ts`.

### EmptyGroupPanel — `@/components/settings/EmptyGroupPanel`
```ts
{ group: SettingGroup }
```
- "아직 설정 항목이 없습니다." 또는 `group.link` 가 있으면 "기존 설정 화면으로 이동 →" 링크.

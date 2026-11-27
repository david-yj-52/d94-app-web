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
- 탭 [작업 공간 프리셋] [사용자 정의 필드] [공통 산출물 규칙]. 프리셋(구 프로젝트 타입, V650)은 작업 공간을 만들 때 상태·필드·보드를 1회 복사하는 출발점입니다 작업 공간 프리셋: 왼쪽 프리셋 목록(이 프리셋으로 만든 작업 공간 수 `spaceCount`)·추가, 오른쪽 선택 프리셋의 이름 변경·삭제(만든 공간이 있어도 가능 — 공간 설정은 그대로)와 기본 세트(고정 4개 잠김 + 필드별 기본 표시·위/아래·빼기·[+ 필드 추가] — 기본 필드와 이 프리셋의 필드만). 화면 문구는 "타입"이 아니라 "프리셋"(V660: 프로젝트에는 타입이 없다). 바꾸면 바로 저장되지만 이미 만든 작업 공간에는 반영되지 않습니다(새 공간부터).
- 프리셋 오른쪽 맨 위 **기본 워크플로 · 보드**(`PresetWorkflow`, 같은 파일, 설계 2.2·V670): 보드 유형 select(칸반·스크럼) · 상태 행(이름·분류 할 일/진행 중/완료·위/아래·빼기) · [+ 상태 추가] [워크플로 저장] → `useUpdateProjectType({boardType, statuses})`. 첫 상태 "할 일"·"완료" 하나 이상·2~10개·이름 1~30자 중복 금지를 화면에서 막습니다. 전이는 이웃 앞뒤 + 처음 → 마지막. 새 공간부터 적용.
- 기본 세트 아래 "이 프리셋의 필드": 목록(기본 세트/라이브러리·출처 표시)·[새 필드] 버튼(aria-label "이 프리셋에 새 필드")·[+ 전역에서 가져오기] select(복사)·수정·삭제(확인 창 "이 필드를 직접 쓰는 프로젝트 N개, Task M개의 값… 작업 공간에 복사된 필드는 남습니다").
- 사용자 정의 필드(전역 라이브러리): 행마다 `catalog.copies` 가 0 이면 "아직 어디에도 적용되지 않음", 아니면 "복사본 N개". 생성 창은 `typeOptions` 로 "넣을 타입" 선택(→ `copyToTypeIds`). 삭제 확인 "가져간 프로젝트·타입의 복사본은 남습니다". 테스트 `CiraSettingsPanel.test.tsx`.
- 공통 산출물 규칙(`GlobalDocRulesTab`, 같은 파일): Task 타입 select · 폴더 이름·자동 생성 행 · [+ 규칙 추가] [저장] → `useSaveGlobalDocRules`(그 타입 통째 교체, ADMIN). 프로젝트가 가져가면 🔒 잠금 복사본이 생기고 여기서 바꿔도 복사본은 그대로.
- 데이터 `hooks/useFields`·`hooks/useSpaces`, `readOnly` 면 편집 UI 를 숨깁니다(ADMIN 판단은 `useIsAdmin`, 권한 검사는 백엔드).

### CustomFieldModal — `@/components/settings/CustomFieldModal`
```ts
{ editTarget?: FieldDef | null; onSubmit: (data: SaveCustomField) => void; isPending?: boolean; onClose: () => void;
  typeOptions?: {id: string; typeNm: string}[] }
```
- 이름(1~100자)·필드 타입(수정 때는 바꿀 수 없음)·선택지(선택형·다중 선택, 한 줄에 하나)·필수 여부. `typeOptions` 가 있고 새로 만들 때만 "넣을 타입" 체크박스(`copyToTypeIds`). 저장은 부모가 `onSubmit` 으로(전역 = CiraSettingsPanel, 프로젝트 = `settings/fields` 화면).

### AyaanSettingsPanel — `@/components/settings/AyaanSettingsPanel`
- props 없음. 탭(전역 정책/Tool/작업공간), 입력마다 `HelpCard`, 서버 422 메시지를 필드 옆에 표시. API `@/lib/api/ayaan`, 검증·변환 헬퍼는 `app/(main)/ayaan/settings/{validate,toolBody}.ts`.

### ApiTokenSettingsPanel — `@/components/settings/ApiTokenSettingsPanel`
```ts
{ isAdmin: boolean }
```
- 서비스 이름은 `serviceLabel`, 전역 토큰 코드는 `GLOBAL_TOKEN_SERVICE`("all"). 발급 직후 MCP 클라이언트 설정 예시(엔드포인트 `NEXT_PUBLIC_MCP_URL`, 없으면 `https://{UMD_HOST}/mcp`).
- 위: 서비스별 허용 체크박스(`isAdmin` 아니면 비활성 + 안내). 아래: 발급 폼(이름 1~100자, 허용된 서비스만, 권한, 만료) → 원문 1회 표시(복사·MCP 설정 예시) → 목록·폐기.
- 데이터 `hooks/useApiTokens` (`["apiTokens"]`, `["apiTokens","services"]`), API `@/lib/api/apiTokens`, 타입 `@/types/apiToken`, mock `lib/mock/apiToken.ts`.

### EmptyGroupPanel — `@/components/settings/EmptyGroupPanel`
```ts
{ group: SettingGroup }
```
- "아직 설정 항목이 없습니다." 또는 `group.link` 가 있으면 "기존 설정 화면으로 이동 →" 링크.

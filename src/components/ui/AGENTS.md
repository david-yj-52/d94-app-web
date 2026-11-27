# L2 · Primitive & 디자인 토큰 (`src/components/ui/`)

> 계층: [L1 프로젝트](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **ui**
> 이 폴더에는 도메인 지식이 없는 primitive만 둡니다. hooks나 lib/api를 import하지 않습니다.

## 1. 디자인 토큰

`tailwind.config.js` 에 서비스 공통 색 `d94.*`(`d94-brand`·`d94-bg`·`d94-border` 등, 값은 `globals.css` `:root`)가 있습니다 → [ADR 0008](../../../docs/decisions/0008-service-design-system.md). 강조색은 `d94-brand` 를 쓰고, 나머지는 Tailwind 기본 팔레트를 아래 규칙대로 씁니다.

| 토큰 | 값 | 용도 |
|---|---|---|
| 배경 | `bg-white` (카드·모달), `bg-slate-50` (입력·hover) | |
| 경계선 | `border-slate-200`, 구분선 `border-slate-100` | |
| 텍스트 | 제목 `text-slate-900`, 본문 `text-slate-700`, 보조 `text-slate-500`, 라벨 `text-xs font-medium text-slate-600` | |
| 강조 | `bg-d94-brand` / hover `bg-d94-brand-hover`, 텍스트·링크 `text-d94-brand`, 포커스 `focus:ring-2 focus:ring-d94-brand`, 선택·hover 배경 `bg-d94-brand-soft` | 주요 버튼, 선택 상태 (예전 `blue-600` 계열은 2026-11-26 일괄 교체) |
| 위험 | `bg-red-500` / hover `bg-red-600`, 텍스트 `text-red-500`, 배경 `bg-red-50` | 삭제, 에러 |
| 라운드 | `rounded-lg` 입력·버튼 / `rounded-xl` 카드·드롭다운 / `rounded-2xl` 모달 / `rounded-full` 배지 | |
| 높이 | `h-10` 기본 버튼·입력 / `h-8` 소형 | |
| 그림자 | `shadow-lg` 드롭다운·토스트 / `shadow-xl` 모달 | |
| 레이어 | 드롭다운 `z-10/z-20`, 모달·토스트 `z-50` | |
| 페이지 폭 | `max-w-6xl mx-auto px-4` (목록) / `max-w-5xl` (상세) | |

> 기존 코드 중 home, notifications, search, todo, solace와 루트 layout은 `gray-*` 팔레트를 씁니다. 새 코드는 `slate-*`를 쓰세요.

## 2. Primitive 카드

### Toast / useToast — `import {useToast} from "@/components/ui/Toast"`
```ts
useToast(): { show: (message: string, type?: "success" | "error") => void; ToastComponent: JSX.Element | null }
Toast(props: { message: string; type?: "success" | "error"; onClose: () => void })  // 보통 직접 쓰지 않음
```
```tsx
const {show, ToastComponent} = useToast();
mutate(data, {onSuccess: () => show("저장되었습니다."), onError: () => show("저장에 실패했습니다.", "error")});
return (<div>... {ToastComponent}</div>);
```
- 화면 우측 하단에 고정되고(아이폰 홈 표시줄 safe-area 만큼 띄움, 폭은 화면 − 2rem 이하) 3초 뒤 자동으로 닫힙니다. 한 번에 하나만 표시됩니다.
- **주의:** 훅을 호출한 컴포넌트 안에 `{ToastComponent}`를 렌더링해야 보입니다. 전역 토스트가 아닙니다.

### Skeleton / SkeletonCard / SkeletonRow — `import {Skeleton, SkeletonCard, SkeletonRow} from "@/components/ui/Skeleton"`
```ts
Skeleton(props: { className?: string })   // animate-pulse bg-slate-200 rounded + className
SkeletonCard()                            // 카드 모양 (제목 + 2줄)
SkeletonRow()                             // 테이블 행 모양
```
```tsx
if (isLoading) return <div className="space-y-3">{[1, 2, 3].map((i) => <SkeletonCard key={i}/>)}</div>;
```

### logoFonts — `import {LOGO_FONTS, logoFontClass} from "@/components/ui/logoFonts"`
```ts
LOGO_FONTS: { id: string; label: string; className: string }[]  // default, noto-sans-kr, nanum-gothic, black-han-sans, do-hyeon
logoFontClass(id: string | undefined): string                   // 모르는 id·undefined → "" (기본 폰트)
```
- 로고 글자용 폰트. `next/font/google` 로 빌드할 때 내려받아 앱에 포함합니다(`preload: false`, 실행 중 CDN 호출 없음). id 는 d94-query `SettingService.LOGO_FONTS` 와 같아야 합니다.
- 사용처: `layout/ApHeader`, `settings/GeneralSettingsPanel`. 테스트에서는 `vi.mock("next/font/google", …)` 로 가짜 className 을 줍니다(`logoFonts.test.ts`).

### Dialog — `import Dialog from "@/components/ui/Dialog"`
```ts
{ open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode; side?: "left"; hideTitle?: boolean; compact?: boolean }
```
- Radix Dialog(`@radix-ui/react-dialog`). 모바일은 전체 화면 시트, `md` 이상은 가운데 모달(최대 `max-w-lg`). `side="left"` 는 왼쪽 서랍(`w-72 max-w-[85vw]`, 모바일 메뉴). `compact` 는 모든 화면에서 가운데 작은 카드(`max-w-sm`, 확인 창).
- 바깥 클릭·Esc·✕ 로 닫히고 포커스를 가둡니다. 부모가 `open` 상태를 갖습니다. ⚠️ 서랍 안에서 서랍 밖에 그려지는 다른 모달(`{open && <XxxModal/>}`)을 열 때는 서랍을 먼저 닫아야 그 모달에 입력할 수 있습니다(Docs layout 참고).
- 내용 패널에 `cira-root` 클래스가 붙습니다(포털이 `.cira-root` 밖에 그려져도 CIRA 자식의 `cira-*` 색이 살도록, 값은 d94 토큰과 같음).
- 사용처: `layout/ApHeader`(모바일 메뉴 서랍), `(main)/docs/layout`(모바일 폴더 트리 서랍), `cira/shell/CiraShell`·`CreateIssueButton`, issue(`ColumnPicker`·`FieldLibraryDialog`·`AttachmentSection`), settings(`CiraSettingsPanel`·`CustomFieldModal`), CIRA issues·settings/fields 화면. 2026-11-26 `cira/ui` 에서 승격([ADR 0006](../../../docs/decisions/0006-cira-design-layer.md) 갱신).

### Button — `import Button from "@/components/ui/Button"`
```ts
ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "md" | "sm" }  // 기본 primary·md
```
```tsx
<div className="flex gap-3 pt-2">
    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>취소</Button>
    <Button type="submit" className="flex-1" disabled={isPending}>저장</Button>
</div>
```
- md = `h-10 px-4 text-sm`, sm = `h-8 px-3 text-xs`, `rounded-lg`, `disabled:opacity-60`. primary `bg-d94-brand`, secondary 흰 바탕 + `border-slate-200`, ghost 테두리 없음, danger `bg-red-500`.
- `className` 은 `tailwind-merge` 로 합쳐져 뒤에 준 값이 이깁니다(`flex-1`, `w-full`, `px-5` 등).
- `type` 기본값을 바꾸지 않습니다(네이티브와 같음: 폼 안에서는 submit). 폼 안의 취소·보조 버튼은 `type="button"` 을 주세요.

### Input / Select / Textarea — `import {Input, Select, Textarea} from "@/components/ui/Input"`
```ts
Input(InputHTMLAttributes<HTMLInputElement>)  Select(SelectHTMLAttributes<HTMLSelectElement>)  Textarea(TextareaHTMLAttributes<HTMLTextAreaElement>)
```
```tsx
<Input {...register("name")} placeholder="이름"/>
<Select value={v} onChange={(e) => setV(e.target.value)}>{options}</Select>
<Textarea {...register("goal")} rows={2}/>
```
- 공통 모양 `w-full rounded-lg border-slate-200 bg-slate-50 px-3 text-sm focus:ring-2 focus:ring-d94-brand`, Input·Select `h-10`, Textarea `py-2 resize-none`. `className` 은 tailwind-merge 로 덮어씀.
- React 19 라 `ref` 가 일반 prop → `{...register()}` 를 그대로 펼치면 됩니다.
- 2026-11-26 표준 마크업과 같은 버튼 39개·입력 31개(25개 파일)를 이 컴포넌트로 교체했습니다. 모양이 다른 버튼(아이콘·링크형·배지형 등)은 그대로 둡니다.

### ConfirmDialog / useConfirm — `import {useConfirm} from "@/components/ui/ConfirmDialog"`
```ts
useConfirm(): { confirm: (message: string, opts?: { title?: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean>; ConfirmComponent: JSX.Element | null }
```
```tsx
const {confirm, ConfirmComponent} = useConfirm();
const handleDelete = async (id: string) => {
    if (!(await confirm("스프린트를 삭제하시겠습니까?", {confirmLabel: "삭제", danger: true}))) return;
    remove.mutate(id);
};
return (<div>... {ConfirmComponent}</div>);
```
- 브라우저 `confirm()` 대체. `useToast` 처럼 훅을 부른 컴포넌트 안에 `{ConfirmComponent}` 를 렌더링합니다(Dialog 포털이라 위치는 상관없음).
- `Dialog compact` + 취소 버튼(secondary)·confirmLabel 버튼(danger 면 빨강). 취소·바깥 클릭·Esc·✕ → `false`. 첫 포커스는 ✕(Enter 로 실수 삭제 방지).
- 사용처(2026-11-26 `confirm()` 15곳 교체): CIRA sprints·versions·wiki·settings/git·workflow, MemberTable, AutomationRuleCard, ApiTokenSettingsPanel, AyaanSettingsPanel, study 문서 목록, ayaan 작업 목록·상세, CIRA Task 상세 삭제·댓글 삭제(`CommentSection`), KanbanBoard 컬럼·보드 삭제, Life Metric 지표 삭제. 테스트 `ApiTokenSettingsPanel.test.tsx`("확인 후 폐기").

## 3. 표준 마크업 (모달 — 버튼·입력은 위 Button·Input 을 쓰세요)

> 모바일 공통 규칙: 손으로 만든 모달 패널에는 `max-h-[calc(100dvh-2rem)] overflow-y-auto` 를 붙여 낮은 화면에서도 버튼까지 스크롤되게 합니다(2026-11-26 기존 20개 모달에 일괄 적용). 입력란 글자는 `globals.css` 가 모바일(< 768px)에서 16px 로 올려 iOS 확대를 막으므로 따로 지정하지 않습니다.

아래 마크업은 `sprint/CreateSprintModal` 등 기존 코드에서 가장 많이 쓰이는 형태를 그대로 옮긴 것입니다.

**모달**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <h2 className="text-lg font-bold text-slate-900 mb-5">제목</h2>
        {/* 본문 */}
        <div className="flex gap-3 pt-2">{/* 취소 / 확인 버튼 */}</div>
    </div>
</div>
```

**버튼** → `ui/Button` (`variant="primary|secondary|ghost|danger"`). 모달 하단의 버튼 쌍은 `className="flex-1"` 로 같은 너비로 맞춥니다.

**폼 필드** (react-hook-form)
```tsx
<div>
    <label className="block text-xs font-medium text-slate-600 mb-1">이름 <span className="text-red-500">*</span></label>
    <Input {...register("name")}/>
    {errors.name && <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>}
</div>
```

**삭제 확인**은 `useConfirm` 을 쓰세요(위 카드).

## 4. 승격 계획 (Phase 2)

| 예정 primitive | 대체 대상 | 근거 |
|---|---|---|
| `Modal` (`open`, `onClose`, `title`, `size`, ESC 닫기) | 모달 overlay 21곳 | 위 모달 마크업 반복 — **새 모달은 `ui/Dialog` 를 쓰세요**(승격 완료) |
| `Button` (`variant: primary/secondary/ghost/danger`, `size: md/sm`) | `<button>` 171곳 | ✅ **완료**(2026-11-26, 표준형 39곳 교체). `loading` 은 필요해질 때 |
| `Input` / `Textarea` / `Select` / `FormField` | 입력 94곳 | ✅ Input·Select·Textarea **완료**(표준형 31곳 교체). `FormField`(라벨+오류) 는 후보 |
| `ConfirmDialog` | 브라우저 `confirm()` 15곳 + 손 마크업 삭제 다이얼로그 | ✅ **완료**(2026-11-26 `useConfirm` — `confirm()` 15곳, 손 마크업 삭제 확인 5곳: Task·댓글·컬럼·보드·지표) |
| `Badge` | 상태·우선순위 배지 (`rounded-full text-xs`) | |
| `EmptyState` | "~이 없습니다" 빈 화면 | |
| `DropdownMenu` | `···` 더보기 메뉴 (issue 상세 등) | |

새 primitive를 만들면 이 문서 §2에 카드를 추가하고, 카탈로그 표에도 등록합니다.

# L2 · Primitive & 디자인 토큰 (`src/components/ui/`)

> 계층: [L1 프로젝트](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **ui**
> 이 폴더에는 도메인 지식이 없는 primitive만 둡니다. hooks나 lib/api를 import하지 않습니다.

## 1. 디자인 토큰

`tailwind.config.js` theme가 비어 있으므로 Tailwind 기본 팔레트를 아래 규칙대로 씁니다.

| 토큰 | 값 | 용도 |
|---|---|---|
| 배경 | `bg-white` (카드·모달), `bg-slate-50` (입력·hover) | |
| 경계선 | `border-slate-200`, 구분선 `border-slate-100` | |
| 텍스트 | 제목 `text-slate-900`, 본문 `text-slate-700`, 보조 `text-slate-500`, 라벨 `text-xs font-medium text-slate-600` | |
| 강조 | `bg-blue-600` / hover `bg-blue-700`, 포커스 `focus:ring-2 focus:ring-blue-500` | 주요 버튼, 선택 상태 |
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
- 화면 우측 하단에 고정되고 3초 뒤 자동으로 닫힙니다. 한 번에 하나만 표시됩니다.
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

## 3. 표준 마크업 (primitive가 생기기 전까지 복사해서 사용)

아래 마크업은 `sprint/CreateSprintModal` 등 기존 코드에서 가장 많이 쓰이는 형태를 그대로 옮긴 것입니다.

**모달**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5">제목</h2>
        {/* 본문 */}
        <div className="flex gap-3 pt-2">{/* 취소 / 확인 버튼 */}</div>
    </div>
</div>
```

**버튼**
```tsx
// primary
<button className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">저장</button>
// secondary
<button className="h-10 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">취소</button>
// danger
<button className="h-10 px-4 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60">삭제</button>
```
모달 하단의 버튼 쌍은 `flex-1`을 붙여 같은 너비로 맞춥니다.

**폼 필드** (react-hook-form)
```tsx
<div>
    <label className="block text-xs font-medium text-slate-600 mb-1">이름 <span className="text-red-500">*</span></label>
    <input {...register("name")}
           className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
    {errors.name && <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>}
</div>
```

**삭제 확인 다이얼로그**는 `issues/[issueId]/page.tsx` 하단의 마크업을 따릅니다. 모달 + `max-w-sm` + 취소/danger 버튼 쌍입니다.

## 4. 승격 계획 (Phase 2)

| 예정 primitive | 대체 대상 | 근거 |
|---|---|---|
| `Modal` (`open`, `onClose`, `title`, `size`, ESC 닫기) | 모달 overlay 21곳 | 위 모달 마크업 반복 |
| `Button` (`variant: primary/secondary/ghost/danger`, `size: md/sm`, `loading`) | `<button>` 171곳 | 위 버튼 마크업 반복 |
| `Input` / `Textarea` / `Select` / `FormField` | 입력 94곳 | 위 폼 필드 반복 |
| `ConfirmDialog` | 브라우저 `confirm()` 8곳 + issue 상세 삭제 다이얼로그 | sprints, versions, wiki, settings 등 |
| `Badge` | 상태·우선순위 배지 (`rounded-full text-xs`) | |
| `EmptyState` | "~이 없습니다" 빈 화면 | |
| `DropdownMenu` | `···` 더보기 메뉴 (issue 상세 등) | |

새 primitive를 만들면 이 문서 §2에 카드를 추가하고, 카탈로그 표에도 등록합니다.

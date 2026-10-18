# L3 · 화면: Todo 🧪 (Server Actions 실험)

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 todo**

## 개요
- **URL:** `/todo` · **파일:** `page.tsx` (서버 컴포넌트, 49줄)
- **실험 주제:** TanStack Query 없이 **서버 컴포넌트 + Server Actions + `revalidatePath`** 로 데이터를 다룹니다. CIRA와 대비되는 방식입니다.
- 진입: 헤더 "Tasks" 메뉴, 홈 허브 "Project Tasks" 카드, 로그인 시 `app/page.tsx`에서 redirect
- 페이지에서 `auth()`를 확인해 세션이 없으면 `/login`으로 보냅니다.

## 화면 구성
```
todo/page.tsx  (async 서버 컴포넌트: await getTodos())
├── 헤더 "Project Tasks" (그라데이션)
├── AddTodoForm      (클라이언트, form action → addTodos, useFormStatus로 pending 표시)
└── TodoItem × n     (클라이언트, 토글 → toggleTodos)
```

## 데이터
- `src/app/actions.ts` (`"use server"`): `getTodos`, `addTodos(formData)`, `toggleTodos(id, status)`
  - ⚠️ `getTodos`는 현재 **하드코딩된 배열**을 반환합니다(fetch 호출은 주석 처리됨).
  - `addTodos`, `toggleTodos`는 구 fetch 래퍼 `src/lib/api.ts`의 `api.fetcher("/api/v1/todos…")`로 백엔드를 호출합니다. 백엔드가 없으면 실패합니다.
  - 변경 후에는 `revalidatePath("/todo")` 또는 `revalidatePath("/")`로 서버 컴포넌트를 다시 렌더링합니다.

## 기능 (L4)
### 추가
- 폼을 제출하면 Server Action이 호출되고, revalidate 후 목록에 새 항목이 반영됩니다. 다만 지금은 `getTodos`가 하드코딩이라 목록에 보이지 않습니다.
### 완료 토글
- 항목을 클릭하면 `toggleTodos`가 상태를 반전합니다.

## 주의·예외
- `any` 타입을 씁니다(`todos.map((todo: any) …)`, `TodoItem`). 이 모듈 밖에서 따라 하지 마세요.
- `src/lib/api.ts`와 `actions.ts`는 **이 실험 전용**입니다. 새 기능은 CIRA 방식(axios + Query)을 기본으로 합니다.
- Server Action은 `/api/proxy`를 거치지 않으므로 `DEV_MOCK_API`의 영향을 받지 않습니다. 추가와 토글을 하려면 백엔드가 필요합니다.

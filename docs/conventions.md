# 코딩 컨벤션

이 문서는 규칙의 상세 설명과 **현재 코드에 남아 있는 예외**를 담습니다. 요약은 [AGENTS.md](../AGENTS.md) §5에 있습니다.

## 1. 네이밍

| 유형 | 패턴 | 예시 |
|---|---|---|
| 페이지 | `page.tsx` | `issues/page.tsx` |
| 컴포넌트 | PascalCase | `IssueTable.tsx`, `CreateIssueModal.tsx` |
| 훅 | `use` + PascalCase | `useIssues.ts` |
| API 함수 파일 | camelCase, 도메인 복수형 | `issues.ts`, `projectSettings.ts` |
| 타입 파일 | camelCase, 도메인 단수형 | `issue.ts` |
| 폴더 | 소문자 도메인명 | `components/milestone/` |

## 2. 포맷

포맷터 설정 파일은 없고, IDE(IntelliJ/WebStorm) 포맷을 따릅니다.
- 들여쓰기 4칸, 큰따옴표, trailing comma
- import 중괄호 안쪽 공백 없음: `import {useState} from "react";`
- 경로는 `@/` 별칭을 사용합니다. 상대경로는 같은 폴더 안에서만 씁니다.

## 3. 컴포넌트

컴포넌트 계층, 재사용 판단, 모달·카드 props 규약은 **[컴포넌트 카탈로그](../src/components/AGENTS.md)** 에 있습니다. 여기서는 일반 규칙만 다룹니다.

- **`"use client"`**: 훅, 이벤트 핸들러, 브라우저 API를 쓰는 파일에만 첫 줄에 붙입니다.
- **페이지**: 조립만 담당합니다. 상태가 많아지면 `components/{domain}/`로 분리합니다.
- **폼**: react-hook-form + zod 스키마 + `@hookform/resolvers/zod`를 사용합니다.
- **사용자 메시지**: 토스트, 빈 상태, 에러 문구는 한국어로 씁니다.

## 4. 스타일

디자인 토큰(색, 라운드, 높이, 그림자)과 표준 마크업(모달, 버튼, 폼 필드)은 **[ui/AGENTS.md](../src/components/ui/AGENTS.md)** 에 있습니다.

- Tailwind 유틸리티를 쓰고, 조건부 클래스는 `clsx` + `tailwind-merge`로 처리합니다.
- 아이콘은 `lucide-react`만 사용합니다.
- Tailwind의 `content` 글롭은 `src/app`, `src/components`만 포함합니다. 다른 폴더에서 클래스 문자열을 만들면 빌드 결과에서 빠집니다.

## 5. 상태 관리

- 서버 데이터는 TanStack Query로 관리합니다. 서버 데이터를 `useState`로 복제하지 마세요.
- 로컬 UI 상태는 `useState`를 씁니다.
- **전역 클라이언트 상태**: zustand가 설치되어 있지만 **store는 아직 하나도 없습니다**. 전역 상태가 필요해지면 `src/stores/use{Name}Store.ts`에 zustand store를 만듭니다. 그 전에 URL 파라미터나 Query 캐시로 해결되는지 먼저 검토하세요.

## 6. 타입

- `any` 금지. 불가피하면 `// eslint-disable-next-line` 대신 사유 주석을 남깁니다.
- 외부 입력은 `unknown`으로 받고 좁혀서 씁니다.

## 7. 알려진 예외 (따라 하지 말 것)

아래 파일은 규칙을 어기고 있습니다. 수정할 때 함께 고치면 좋지만, **새 코드의 참고 예시로 쓰지 마세요.**

**인라인 `style={{}}`** (차트 크기·진행률 등 동적 수치 때문에 일부는 정당한 예외일 수 있음)
- `src/app/(main)/dashboard/page.tsx`
- `src/app/(main)/projects/[projectId]/reports/{burndown,cfd,velocity}/page.tsx`
- `src/app/(main)/projects/[projectId]/wiki/page.tsx`
- `src/components/issue/AttachmentSection.tsx`
- `src/components/milestone/MilestoneCard.tsx`
- `src/components/search/CqlEditor.tsx`
- `src/components/wiki/WikiTree.tsx`

**`any` 사용**
- `src/hooks/useIssues.ts`
- `src/components/layout/ApHeader.tsx`
- 실험 모듈: `src/app/page.tsx`, `src/app/(main)/todo/page.tsx`, `src/components/TodoItem.tsx`, `src/lib/api.ts`, `src/lib/messaging/solace/useSolace.ts`

**API 함수가 `res.data.data` 대신 응답 전체를 반환** (의도된 예외)
- `src/lib/api/interfaceTests.ts`의 `callInterfaceTest`: 통신 확인 화면이라 상태코드·소요시간·`X-Trace-Id`·본문을 `InterfaceCallResult`로 돌려주고 4xx·5xx 도 throw 하지 않습니다. 일반 도메인 API 는 따라 하지 마세요.

**화면 단위 예외**(페이지에서 `lib/api` 직접 import, 비대한 페이지, `confirm()` 사용 등): [src/app/AGENTS.md §4](../src/app/AGENTS.md)

**색상**: 루트 layout, home, notifications, search, todo, solace가 `gray-*`를 씁니다(규칙은 slate).

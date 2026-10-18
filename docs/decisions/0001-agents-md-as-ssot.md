# ADR 0001: AI 컨텍스트 문서로 AGENTS.md를 단일 기준으로 사용

- 상태: 채택
- 날짜: 2026-10-15

## 배경
- AI 코딩 도구로 Cursor와 Claude Code를 함께 쓰고, 다른 도구도 쓸 수 있습니다.
- 기존에는 `CLAUDE.md` 하나만 있었습니다. 그래서 도구마다 받는 컨텍스트가 달랐고, 문서 내용 일부가 실제 코드와 어긋나 있었습니다(Zustand 사용, 모든 컴포넌트 `"use client"` 등).

## 결정
- 루트 `AGENTS.md`를 단일 기준 문서로 둡니다. AGENTS.md는 Cursor, Codex, Copilot 등 여러 도구가 지원하는 공통 규약입니다.
- 도구별 파일은 포인터만 둡니다. `CLAUDE.md`는 `@AGENTS.md` import 한 줄입니다.
- `AGENTS.md`는 짧게 유지합니다(요약, 규칙, 절차, 링크). 상세 내용은 `docs/`로 나눠 필요할 때만 읽게 합니다.
- 규칙(목표)과 현재 예외(현실)를 분리해서 기록합니다(`docs/conventions.md` §7).

## 결과
- 규칙을 바꿀 때는 `AGENTS.md`와 `docs/`만 수정합니다. 도구별 파일에 규칙을 직접 쓰지 않습니다.
- 새 도구를 도입하면 해당 도구가 AGENTS.md를 읽는지 확인하고, 읽지 않으면 포인터 파일을 추가합니다.
  - 예: Gemini CLI → `GEMINI.md`, Copilot → `.github/copilot-instructions.md`

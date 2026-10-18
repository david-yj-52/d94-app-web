# web-plate — UI 학습 · 웹 기능 실험장

UI 기술을 배우고 다양한 웹 기능을 직접 만들어 보는 연습장입니다. Next.js 16 App Router, React 19, TypeScript로 만들었습니다.
하나의 앱 안에 여러 **실험 모듈**이 함께 있습니다.

| 모듈 | 경로 | 실험 주제 |
|---|---|---|
| CIRA | `/projects` | Jira 유사 협업 도구 (Query, 칸반 DnD, 차트, 리치 에디터) |
| MPMS | `/mpms` | 마스터-디테일 테이블 |
| Solace | `/solace` | WebSocket 메시징 |
| todo | `/todo` | Server Actions |

상세: [docs/modules.md](docs/modules.md)

## 빠른 시작

```bash
npm install
cp .env.sample .env.local   # 값 채우기
npm run dev                 # http://localhost:3000
```

백엔드 없이 실행하려면 `.env.local`에서 `DEV_ADMIN_LOGIN=true`, `DEV_MOCK_API=true`로 설정하고 **admin / admin**으로 로그인하세요.

## 문서 계층 (사람·AI 도구 공통)

가이드는 4계층으로 나뉘고, 각 문서는 해당 코드 폴더 안에 있습니다. 전체 지도는 **[AGENTS.md §0](AGENTS.md)** 에 있습니다.

| 계층 | 범위 | 시작점 |
|---|---|---|
| L1 프로젝트 | 성격, 전역 규칙, 명령어 | [AGENTS.md](AGENTS.md), [docs/](docs/) |
| L2 폴더 | 폴더 역할·규칙·목록 | [src/app](src/app/AGENTS.md) · [src/components (컴포넌트 카탈로그)](src/components/AGENTS.md) · [src/hooks](src/hooks/AGENTS.md) · [src/lib](src/lib/AGENTS.md) |
| L3 화면 | 화면 조립도, 데이터 | [화면 목록](src/app/AGENTS.md) |
| L4 기능 | 화면 안 기능 동작 | 각 L3 문서의 `## 기능` 섹션 |

**화면을 만들 때는 [컴포넌트 카탈로그](src/components/AGENTS.md)부터 보세요.**

### 공통 문서 (`docs/`)

| 문서 | 내용 |
|---|---|
| [architecture.md](docs/architecture.md) | 구조, 요청 흐름, 인증, 라우트 |
| [conventions.md](docs/conventions.md) | 네이밍·포맷·타입 규칙과 기존 예외 |
| [dev-setup.md](docs/dev-setup.md) | 환경 변수, 실행, 검증 |
| [modules.md](docs/modules.md) | 실험 모듈 목록, 새 실험 추가 방법 |
| [known-issues.md](docs/known-issues.md) | 알려진 문제 |
| [decisions/](docs/decisions/) | ADR |
| [LOCAL_AGENT_HTTPS_GUIDE.md](LOCAL_AGENT_HTTPS_GUIDE.md) | 배포 사이트에서 로컬 에이전트 호출 (HTTPS) |

## AI 도구 사용

- 규칙은 `AGENTS.md` 계열 문서에서만 관리합니다.
- Cursor와 Codex는 `AGENTS.md`를 자동으로 읽습니다(하위 폴더 포함).
- Claude Code는 각 폴더의 `CLAUDE.md` → `@AGENTS.md` import로 읽습니다.
- 새 폴더 문서를 만들면 `CLAUDE.md`(`@AGENTS.md` 한 줄)도 함께 만드세요.
- **코드를 바꾸면 문서도 같은 커밋에서 갱신합니다.** 무엇을 갱신할지는 [AGENTS.md §10](AGENTS.md) 매핑표를 따르고, `npm run docs:check`로 확인합니다.

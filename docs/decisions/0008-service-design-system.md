# ADR 0008 · D94 서비스 공통 디자인 시스템 (CIRA 기준)

- 날짜: 2026-11-26
- 상태: 채택
- 관련: [ADR 0006 CIRA 디자인 계층](./0006-cira-design-layer.md)

## 배경

기존에는 CIRA(`.cira-root`)에만 디자인 토큰이 정의되어 있었고, `(main)` 및 `(auth)` 모듈은 각 화면마다 `blue-600`, `indigo-600`, `black` 등 제각각의 색상과 컴포넌트 크기를 사용했습니다. 서비스 전체의 일관성과 모바일 대응을 위해 CIRA 기준의 공통 디자인 토큰과 컴포넌트 규격을 정의합니다.

## 1. 공통 컬러 토큰 (`:root` / Tailwind `d94.*`)

| 토큰 | 값 | 용도 |
|---|---|---|
| `d94-brand` | `#4F46E5` (Indigo 600) | Primary CTA 버튼, 활성 탭/링크, 브랜드 포인트 |
| `d94-brand-hover` | `#4338CA` (Indigo 700) | Primary 버튼 호버 |
| `d94-brand-soft` | `#EEF2FF` (Indigo 50) | 활성 메뉴 배경, 선택된 배지/카드 강조 |
| `d94-bg` | `#F4F5F7` | 페이지 전체 캔버스 배경 |
| `d94-surface` | `#FFFFFF` | 카드·모달·테이블·헤더 표면 |
| `d94-sidebar` | `#FAFAFA` | 사이드바 영역 배경 |
| `d94-border` | `#E5E7EB` | 구분선·카드·입력 필드 테두리 |
| `d94-text` | `#1F2937` | 기본 본문 텍스트 |
| `d94-muted` | `#6B7280` | 보조 설명·메타 정보·비활성 아이콘 |
| `d94-danger` | `#EF4444` | 삭제·에러·긴급 상태 |
| `d94-success` | `#22C55E` | 완료·성공·정상 상태 |
| `d94-warning` | `#F59E0B` | 경고·주의·대기 상태 |

## 2. 타이포그래피 & 컴포넌트 크기 기준 (CIRA 기준)

| 구분 | 모바일 (`< 768px`) | 데스크톱 (`>= 768px`) | 비고 |
|---|---|---|---|
| **기본 본문** | `14px` (`text-sm`) | `14px` (`text-sm`) | 루트 기준 통일 |
| **페이지 제목 (`h1`)** | `text-xl font-semibold` (20px) | `text-xl` ~ `text-2xl font-bold` | `PageHeader` 기준 |
| **섹션 제목 (`h2`)** | `text-base font-semibold` (16px) | `text-lg font-semibold` (18px) | |
| **상단 헤더 높이** | `h-12` (48px) 또는 `h-14` (56px) | `h-12` / `h-14` | 모바일 좌우 패딩 `px-3` |
| **사이드바 너비** | 드로어 (`w-72 max-w-[85vw]`) | 접힘 `w-14` (56px) / 펼침 `w-60` (240px) | `CiraShell` 기준 |
| **터치 타겟 (버튼·아이콘)** | 최소 `h-10` (40px) | `h-9` (36px) ~ `h-10` (40px) | 아이콘 버튼은 `h-10 w-10` 권장 |
| **입력 필드 (`input`/`select`)** | `h-10` (40px), `text-base` or `text-sm` | `h-9` (36px) ~ `h-10` (40px) | 모서리 `rounded-md` / `rounded-lg` |
| **카드·패널** | `rounded-xl` (12px), `p-4` | `rounded-xl` (12px), `p-5`~`p-6` | `border border-d94-border bg-d94-surface` |
| **모달 / 다이얼로그** | 전체 화면 시트 (`inset-0`) | 중앙 모달 (`max-w-lg rounded-md`) | `cira/ui/Dialog` 기준 |
| **데이터 테이블** | 카드 리스트(`md:hidden`) 또는 `overflow-x-auto` | 테이블(`hidden md:block`) | `IssueTable` 패턴 준수 |

## 3. 브레이크포인트 & 레이아웃 규칙

- **모바일 (`< 768px`, default)**: 1단 세로 배치, 사이드바는 햄버거 드로어로 전환, 팝오버는 `max-w-[calc(100vw-1.5rem)]` 제한.
- **태블릿 (`md`: `768px` ~ `1023px`)**: 사이드바 아이콘 전용(`w-14`) 또는 상단 드로어.
- **데스크톱 (`lg`: `>= 1024px`)**: 풀 사이드바(`w-60`), 2~3단 레이아웃(`max-w-6xl` ~ `max-w-[1400px]`).
- **가로 오버플로 방지**: 루트 `html, body`에 `overflow-x: clip` 적용(sticky 유지), 모든 `flex` 컨테이너에 `min-w-0` 및 필요 시 `flex-wrap` 적용.

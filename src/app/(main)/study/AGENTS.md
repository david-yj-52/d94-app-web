# L3 · 화면: PDF 학습 🧪

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 study**

## 개요
- **URL:** `/study` · **파일:** `page.tsx` (클라이언트 컴포넌트)
- **목적:** 공부용 PDF를 올리고 문서 목록을 관리합니다. 설계: d94-note `docs/superpowers/specs/2026-11-09-pdf-study-viewer-design.md`
- **진입:** 홈 "실험 모듈 › PDF 학습" 카드 · **접근:** 보호 경로(`routeAccess.ts`)
- 하위 화면: [뷰어](./[documentId]/AGENTS.md), [노트 모아보기](./notes/AGENTS.md)

## 화면 구성
```
study/page.tsx
├── 제목 + "모든 노트 →" 링크
├── UploadDropzone   (분할 업로드 진행률)
├── DocumentList     (상태 배지, READY → /study/{id}, 삭제 확인)
└── {ToastComponent}
```
컴포넌트 카드: [study](../../../components/study/AGENTS.md)

## 데이터
| 훅 | 엔드포인트 | mock |
|---|---|---|
| `useStudyDocuments` | `GET /v1/study/documents` (PARSING 있으면 3초 재조회) | ✅ |
| `useUploadStudyDocument` | `POST /v1/study/documents/uploads` → `PUT …/parts/{n}` ×N → `POST …/complete` | ✅ (complete 즉시 READY) |
| `useDeleteStudyDocument` | `DELETE /v1/study/documents/{id}` | ✅ |

## 기능
- **분할 업로드:** UMD 요청 본문 상한 1MB·Vercel 4.5MB 때문에 서버가 준 `partSize`(768KB)로 잘라 순서대로 보냅니다. 조각 실패 1회 재시도, complete 가 `missing=…`이면 그 조각만 다시 보내고 1회 재시도.
- 백엔드는 업로드 완료 후 비동기로 d94-app-pdf 파서를 호출합니다(PARSING → READY/FAILED).

# L3 · Feature 전체 통합 (`/cira/projects/[projectId]/features`)

> 계층: [L1](../../../../../../../AGENTS.md) › [L2 app](../../../../../AGENTS.md) › [L3 projects](../../AGENTS.md) › **L3 features**

## 화면 구성
```
FeaturesPage
├── PageHeader(actions: 작업 공간 필터 Select)
└── Skeleton | EmptyState | FeatureTree(projectId, nodes, spaces)
```

## 데이터
- `useSpaces(projectId)` → `["spaces", projectId]`
- `useFeatures(projectId, spaceId)` → `["features", projectId, spaceId]` — d94-query `GET /v1/projects/{id}/features?spaceId=`

## 기능
- 2단계 Feature(V650, Epic 대체): **공통 Feature(COMMON, 공간 없음)가 항상 맨 위**, 그 아래 연결된 단위 Feature(UNIT), 그다음 공통에 안 묶인 단위 Feature. 순서는 서버가 정한다.
- 공간 필터를 고르면 단위 Feature 는 그 공간 것만, 공통 Feature 는 항상 보인다.
- 행을 누르면 Task 상세. Feature 는 Task 생성 모달에서 유형 `Feature` 로 만든다(공통 체크 = COMMON).

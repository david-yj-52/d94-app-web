# L3 · 화면: MPMS 🧪 (플랫폼·제품 관리 실험)

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 mpms**
> 컴포넌트 카드: [mpns](../../../components/mpns/AGENTS.md)

## 개요
- **URL:** `/mpms` · **파일:** `page.tsx` (209줄, 클라이언트)
- **실험 주제:** 마스터-디테일 테이블 UI, 검색 필터링, 추가 팝업. **백엔드 없이 로컬 상태로만** 동작합니다.
- 진입: 헤더 "MPMS" 메뉴, 홈 허브 카드. middleware 보호 대상이 아니고 페이지에서 인증을 확인하지도 않습니다.
- 관련 타입: `src/app/model/mpms_model.ts`, `src/app/model/common_model.ts`, `src/app/constant/types.ts`

## 화면 구성
```
mpms/page.tsx  (상태: platforms, products, 선택 id 2개, 검색어 2개, 팝업 open 2개)
├── PlatformTable  (검색·선택·추가)
├── ProductTable   (선택한 플랫폼의 제품만, 미선택 시 disabled)
├── DetailPanel    (선택한 플랫폼·제품 상세)
├── PlatformAddPopup open={…}
└── ProductAddPopup  open={…} platformName
```

## 데이터
- 초기값은 `MOCK_PLATFORMS`, `MOCK_PRODUCTS` 상수입니다. 새로고침하면 초기화됩니다.
- 필터링은 `useMemo`로 이름, 별칭, URL, 메모를 대상으로 대소문자 구분 없이 검색합니다.

## 기능 (L4)
### 플랫폼 선택 → 제품 목록
- 플랫폼을 선택하면 해당 `platformId`의 제품만 보여 줍니다. 제품을 선택하면 상세 패널이 갱신됩니다.
### 추가
- 팝업에서 이름, 별칭, URL, 메모를 입력하면 `handleAddPlatform` / `handleAddProduct`가 로컬 배열에 추가합니다.

## 주의·예외
- 실험 모듈입니다. CIRA 코드에서 `components/mpns`를 import하지 마세요.
- 팝업은 CIRA 모달과 다르게 `open` prop 방식입니다.
- 백엔드 연동을 실습하려면 CIRA처럼 `types → lib/api → hooks → mock` 순서로 확장하세요.

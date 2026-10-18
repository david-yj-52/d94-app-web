# L2 · mpns 컴포넌트 (MPMS 실험 모듈) 🧪

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **mpns**
> 사용 화면: [mpms](../../app/(main)/mpms/AGENTS.md). 폴더명 `mpns`는 기존 이름이며, 라우트는 `mpms`입니다.
> **MPMS 전용입니다.** 다른 모듈에서 import하지 마세요. 패턴만 참고하세요.

마스터(플랫폼) → 디테일(제품) → 상세 패널로 이어지는 3단 구성입니다. 모든 컴포넌트가 표현 컴포넌트이고, 상태는 `mpms/page.tsx`가 가집니다. API 없이 로컬 상태와 mock 상수로 동작합니다.

### PlatformTable — `@/components/mpns/PlatformTable`
```ts
{ platforms: Platform[]; selectedPlatformId: string | null; onSelectPlatform: (id: string) => void;
  searchValue: string; onChangeSearch: (v: string) => void; onClickAdd: () => void }
```

### ProductTable — `@/components/mpns/ProductTable`
```ts
{ products: Product[]; selectedProductId: string | null; onSelectProduct: (id: string) => void;
  searchValue: string; onChangeSearch: (v: string) => void; onClickAdd: () => void; platformName: string; disabled?: boolean }
```
- 플랫폼을 선택하지 않으면 `disabled` 상태가 됩니다.

### DetailPanel — `@/components/mpns/DetailPanel`
```ts
{ platform: Platform | null; product: Product | null }
```

### PlatformAddPopup / ProductAddPopup
```ts
{ open: boolean; onClose: () => void; onSubmit: (data: { name: string; alias: string; url: string; note?: string }) => void }
// ProductAddPopup 은 + platformName: string
```
- ⚠️ CIRA 모달과 달리 **`open` prop을 받습니다**. 또한 폼 라이브러리 없이 `useState`로 입력을 관리합니다.

**참고 가치:** 검색 + 선택 + 추가 버튼이 붙은 "선택 가능한 테이블" 패턴입니다. 다른 화면에서 같은 UI가 필요하면 `ui/SelectableTable`로 일반화하는 것을 검토하세요.

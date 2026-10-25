# L2 · interfaceTest 컴포넌트 🧪

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **interfaceTest**
> 사용 화면: [interface-test](../../app/(main)/interface-test/AGENTS.md). 이 모듈 밖에서 import 하지 않습니다.

### InterfaceRequestPanel — `@/components/interfaceTest/InterfaceRequestPanel`
```ts
export interface InterfaceRequestForm { itemId: string; name: string; content: string; status: string }
{ form: InterfaceRequestForm; onChange: (form: InterfaceRequestForm) => void;
  onCall: (req: InterfaceCallRequest) => void; isPending: boolean }
```
- 입력 폼(제어 컴포넌트) + 메서드 버튼 7개(`ACTIONS`). 버튼은 `aria-label="{METHOD} {라벨}"`.
- 본문 규칙(`buildBody`): POST·PUT 은 폼 전체(빈 값은 생략), PATCH 는 값이 있는 필드만, 나머지는 본문 없음.
- `needsId` 버튼은 `form.itemId` 가 비면 비활성입니다.

### InterfaceCallLog — `@/components/interfaceTest/InterfaceCallLog`
```ts
{ logs: InterfaceCallResult[]; onClear: () => void }
```
- 한 줄 요약(메서드·경로·상태·ms) + `<details>` 로 호출 시각·`X-Trace-Id`·`Location`·요청/응답 본문.
- 상태 색: 2xx emerald, 3xx slate, 4xx amber, 5xx·0 red. 0·502·503·504 에는 원인 판단 문구.

### InterfaceItemTable — `@/components/interfaceTest/InterfaceItemTable`
```ts
{ items: InterfaceTestItemResponse[]; isLoading: boolean; errorMessage?: string;
  selectedId: string; onSelect: (item: InterfaceTestItemResponse) => void; onRefresh: () => void }
```
- 로딩은 `SkeletonRow` 3개, 오류는 `errorMessage` 를 빨간 띠로, 빈 목록은 안내 문구.

### MethodBadge — `@/components/interfaceTest/MethodBadge`
```ts
{ method: InterfaceTestMethod }        // + export const METHOD_COLOR: Record<InterfaceTestMethod, string>
```
- 메서드별 색 배지(`rounded-full`, 고정 폭 `w-16`). RequestPanel·CallLog 에서 사용합니다.

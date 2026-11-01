import {setupServer} from "msw/node";
import {handlers, recorded} from "./handlers";

export const server = setupServer(...handlers);

/** setup.ts 가 매 테스트 후 부른다 */
export function resetRecorded() {
    recorded.length = 0;
}

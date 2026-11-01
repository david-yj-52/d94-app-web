/** setup.ts 의 next-auth/react mock 이 읽는 세션 상태. 테스트마다 authenticated 로 되돌린다 */
export const authState: {status: "authenticated" | "unauthenticated" | "loading"} = {
    status: "authenticated",
};

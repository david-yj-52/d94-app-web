"use server";

import {revalidatePath} from "next/cache";
import {api} from "@/lib/api";

// 1. 할 일 목록 가져오기
export async function getTodos() {
    try {
        // return await api.fetcher("/api/v1/todos", { cache: "no-store" });
        return [
            {id: 1, text: "백엔드 없이 프론트 완성하기", completed: false},
            {id: 2, text: "오타 수정 완료", completed: true},
        ];
    } catch (e) {
        return []; // 에러 시 빈 배열 반환
    }
}

// 2. 할 일 추가하기
export async function addTodos(formData: FormData) {
    const text = formData.get("todoText") as string;
    if (!text.trim()) return;

    await api.fetcher("/api/v1/todos", {
        method: "POST",
        body: JSON.stringify({text, completed: false}),
    });
    revalidatePath("/"); // 데이터가 변했으니 페이지 새로고침(백그라운드)
}

// 3. 완료 상태 토글
export async function toggleTodos(id: number, currentStatus: boolean) {
    await api.fetcher(`/api/v1/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({completed: !currentStatus}),
    });
    revalidatePath("/todo");
}

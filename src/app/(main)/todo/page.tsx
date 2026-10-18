import {getTodos} from "@/app/actions";
import {auth} from "@/auth";
import AddTodoForm from "@/components/AddTodoForm";
import TodoItem from "@/components/TodoItem";
import {redirect} from "next/navigation";

export default async function TodoPage() {
    const session = await auth();

    if (!session) redirect("/login");
    const todos = await getTodos();

    return (
        <div className="py-10">
            <main className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/*  상단 헤더 섹션 */}
                <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-50">
                    <h1 className="text-2xl font-bold text-white">Project Tasks</h1>
                    <p className="text-blue-100 text-sm opacity-90">
                        Manage your daily goals
                    </p>
                </div>

                <div className="p-6">
                    {/* 입력 폼 (Client Component) */}
                    <AddTodoForm/>
                    {/* 할 일 목록 */}
                    <div className="relative">
                        <ul className="space-y-3">
                            {todos.map((todo: any) => (
                                <TodoItem key={todo.id} todo={todo}/>
                            ))}
                        </ul>

                        {/* 데이터가 없을 때의 Empty State */}
                        {todos.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-3">📝</div>
                                <p className="text-gray-400">
                                    할 일이 없습니다. <br/> 새로운 작업을 추가해보세요.!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

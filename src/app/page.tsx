import {auth} from "@/auth";
import {redirect} from "next/navigation";

export default async function HomePage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    } else {
        redirect("/todo");
    }
}

// export default async function Home() {
//   const session = await auth();
//   const todos = await getTodos();

//   if (!session) return <LoginButton />;

//   return (
//     <div className="min-h-screen bg-gray-50 py-10">
//       <main className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
//         <p> 환영합니다, {session.user?.name} 님!</p>
//         <img src={session.user?.image || ""} alt="프로필" />
//         <AgentStatusButton />
//         <div className="p-6 bg-blue-600">
//           <h1 className="text-2xl font-bold text-white">Project Tasks</h1>
//           <p className="text-blue-100 text-sm">Learning Next js</p>
//         </div>

//         <div className="p-6">
//           {/* 할 일 입력 폼 */}

//           <form action={addTodos} className="flex gap-2 mb-8">
//             <input
//               type="text"
//               name="todoText"
//               placeholder="새로운 할 일을 입력하세요"
//               className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//               required
//             />
//             <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
//               Add
//             </button>
//           </form>
//           {/* 리스트 출력 */}
//           <ul className="space-y-2">
//             {todos.map((todo: any) => (
//               <TodoItem key={todo.id} todo={todo} />
//             ))}
//             {todos.length === 0 && (
//               <li className="text-center py-10 text-gray-400">
//                 {" "}
//                 데이터가 없습니다.
//               </li>
//             )}
//           </ul>
//         </div>
//       </main>
//     </div>
//   );
// }

"use client";

import {toggleTodos} from "@/app/actions";
import {CheckCircle2, Circle} from "lucide-react";

export default function TodoItem({todo}: { todo: any }) {
    return (
        <li
            onClick={() => toggleTodos(todo.id, todo.completed)}
            className="flex items-center justify-between p-4 rounded-x1 border border-gray-50 hover:bg-gray-50 cursor-pointer transition-all group"
        >
            <div className="flex items-center gap-3">
                {todo.completed ? (
                    <CheckCircle2 className="text-green-500 w-6 h-6"/>
                ) : (
                    <Circle className="text-gray-300 group-hover:text-blue-400 w-6 h-6"/>
                )}
                <span
                    className={`text-lg ${
                        todo.completed ? "line-through text-gray-400" : "text-gray-700"
                    }`}
                >
          {todo.text}
        </span>
            </div>
        </li>
    );
}

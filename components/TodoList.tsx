"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

export default function TodoList({ userId, projectId }: { userId: string; projectId: string }) {
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [reminder, setReminder] = useState("");

  useEffect(() => {
    if (!userId || !projectId) return;

    const todosCollection = collection(db, `users/${userId}/projects/${projectId}/todos`);
    const unsub = onSnapshot(todosCollection, (snapshot) => {
      const todoData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTodos(todoData);
    });

    return () => unsub();
  }, [userId, projectId]);

  // Add a new todo
  const addTodo = async () => {
    if (!newTodo.trim()) return;

    await addDoc(collection(db, `users/${userId}/projects/${projectId}/todos`), {
      title: newTodo,
      completed: false,
      reminderTime: reminder || null,
      createdAt: new Date().toISOString(),
    });

    setNewTodo("");
    setReminder("");
  };

  // Toggle complete
  const toggleTodo = async (id: string, completed: boolean) => {
    const todoRef = doc(db, `users/${userId}/projects/${projectId}/todos/${id}`);
    await updateDoc(todoRef, { completed: !completed });
  };

  // Delete todo
  const deleteTodo = async (id: string) => {
    await deleteDoc(doc(db, `users/${userId}/projects/${projectId}/todos/${id}`));
  };

  // Alarm system
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      todos.forEach((todo) => {
        if (todo.reminderTime && !todo.completed) {
          const reminderDate = new Date(todo.reminderTime);
          if (Math.abs(reminderDate.getTime() - now.getTime()) < 30000) {
            // within 30s window
            const audio = new Audio("/alarm.mp3");
            audio.play().catch(() => {});
            alert(`⏰ Reminder: ${todo.title}`);
          }
        }
      });
    }, 30000); // check every 30s

    return () => clearInterval(interval);
  }, [todos]);

  return (
    <div className="mt-6 w-full max-w-[400px] rounded-lg bg-white p-4 shadow-md">
      <h2 className="font-semibold text-lg mb-2">Schedule</h2>

      <div className="flex flex-col gap-2 mb-3">
        <input
          type="text"
          placeholder="New task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          className="p-2 bg-[#f0f0f0] rounded outline-none"
        />
        <input
          type="datetime-local"
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          className="p-2 bg-[#f0f0f0] rounded"
        />
        <button
          onClick={addTodo}
          className="bg-[#4D3BED] cursor-pointer outline-none text-white rounded p-2 hover:opacity-70 transition"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center justify-between p-2 rounded ${
              todo.completed ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
              />
              <span className={todo.completed ? "line-through text-gray-500" : ""}>
                {todo.title}
              </span>
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DescriptionBoxProps {
  userId: string;
  projectId: string;
}

export default function DescriptionBox({ userId, projectId }: DescriptionBoxProps) {
  const [description, setDescription] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!userId || !projectId) return;

    const projectRef = doc(db, "users", userId, "projects", projectId);

    const unsubscribe = onSnapshot(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const desc = data?.description || "";
        setDescription(desc);
        if (!isEditing) setNewDesc(desc);
      }
    });

    return () => unsubscribe();
  }, [userId, projectId, isEditing]);

  const handleSave = async () => {
    if (!userId || !projectId) return;

    try {
      setIsSaving(true);
      const projectRef = doc(db, "users", userId, "projects", projectId);
      await updateDoc(projectRef, { description: newDesc.trim() });
      setIsEditing(false);
      setShowPopup(false);
    } catch (error) {
      console.error("Error saving description:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="group relative w-full max-w-[400px]"
      onMouseEnter={() => !isEditing && setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
    >
      {!isEditing ? (
        <p
          className="overflow-hidden text-ellipsis whitespace-nowrap w-full cursor-pointer text-gray-800"
          onDoubleClick={() => setIsEditing(true)}
        >
          {description || "No description yet..."}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <input
            className="border px-2 py-1 rounded w-full text-sm"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            disabled={isSaving}
          />
          <button
            onClick={handleSave}
            className="px-2 py-1 bg-[#4D3BED] cursor-pointer text-white rounded text-sm hover:opacity-50 disabled:bg-gray-400"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      )}

      {showPopup && !isEditing && description && (
        <div className="absolute left-0 top-full z-50 mt-2 w-max max-w-[90vw] sm:max-w-[400px] rounded border border-gray-300 bg-white p-2 text-sm shadow-lg">
          {description}
        </div>
      )}
    </div>
  );
}

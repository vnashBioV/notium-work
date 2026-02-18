"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useProjects } from "@/context/ProjectsContext";
import { FolderOpenDot } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function AddProjectModal({ isOpen, onClose, user }: AddProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [backgroundColour, setBackgroundColour] = useState("#DEF8CB");
  const [status, setStatus] = useState<"not-started" | "in-progress" | "completed">("not-started");
  const [timeSpentOnProject, setTimeSpentOnProject] = useState<number>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshProjects } = useProjects();

  const resetFields = () => {
    setProjectName("");
    setDescription("");
    setBackgroundColour("#DEF8CB");
    setStatus("not-started");
    setTimeSpentOnProject(0);
    setImageFile(null);
    setAttachments([]);
  };

  const uploadFileToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    return data.secure_url;
  };

  const handleAddProject = async () => {
    if (!projectName || !user) return;
    setLoading(true);

    try {
      const imageUrl = imageFile ? await uploadFileToCloudinary(imageFile) : "";

      // Upload attachments
      const attachmentUrls: string[] = [];
      for (const file of attachments) {
        const url = await uploadFileToCloudinary(file);
        attachmentUrls.push(url);
      }

      const projectData = {
        name: projectName,
        description,
        backgroundColour,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        imageUrl,
        status,
        timeSpentOnProject,
        attachments: attachmentUrls,
      };

      const userProjectsCollection = collection(db, `users/${user.uid}/projects`);
      await addDoc(userProjectsCollection, projectData);

      await refreshProjects();
      resetFields();
      onClose();
    } catch (error) {
      console.error("Error adding project: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetFields();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000c9] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-lg sm:p-6"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
        <h2 className="text-lg font-bold mb-4">Add New Project</h2>

        <input
          type="text"
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full p-2 text-sm bg-[#e7e7e7] rounded mb-3 outline-none"
        />

        <textarea
          placeholder="Project Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 text-sm bg-[#e7e7e7] rounded mb-3 outline-none"
          rows={3}
        />

        <label className="block mb-2 text-sm">Background Colour</label>
        <input
          type="color"
          value={backgroundColour}
          onChange={(e) => setBackgroundColour(e.target.value)}
          className="w-16 h-8 rounded mb-4"
        />

        <label className="block mb-2 text-sm">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="w-full p-2 mb-3 rounded bg-[#e7e7e7] outline-none"
        >
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <label className="block mb-2 text-sm">Time Spent (hours)</label>
        <input
          type="number"
          value={timeSpentOnProject}
          onChange={(e) => setTimeSpentOnProject(Number(e.target.value))}
          className="w-full p-2 mb-3 rounded bg-[#e7e7e7] outline-none"
        />

        {/* Main Image */}
        <label className="block mb-2 text-sm">Image</label>
        <label
          htmlFor="projectImageInput"
          className="cursor-pointer flex items-center justify-center w-16 h-16 rounded bg-gray-100 hover:bg-gray-200 mb-3"
        >
          {imageFile ? (
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Preview"
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <FolderOpenDot className="w-8 h-8 text-gray-500" />
          )}
          <input
            id="projectImageInput"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>

        {/* Attachments */}
        <label className="block mb-2 text-sm">Attachments</label>
        <label 
          htmlFor="projectAttachments"
          className="cursor-pointer flex items-center justify-center w-16 h-16 rounded bg-gray-100 hover:bg-gray-200 mb-3"
        >
          <div className="flex gap-2 mb-3 flex-wrap">
            {attachments.length > 0 ? (
              attachments.map((file, idx) => (
                <img
                  key={idx}
                  src={URL.createObjectURL(file)}
                  alt={`Attachment ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded"
                />
              ))
            ) : (
              <FolderOpenDot className="w-8 h-8 text-gray-500" />
            )}
          </div>
          <input
            id="projectAttachments"
            type="file"
            multiple
            onChange={(e) => setAttachments(Array.from(e.target.files || []))}
            className="hidden"
          />
        </label>
        
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 active:scale-[0.98] transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAddProject}
            disabled={loading}
            className="px-4 py-2 rounded bg-[#4D3BED] text-white hover:opacity-80 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

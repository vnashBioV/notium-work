"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";

export type Project = {
  id?: string;
  name: string;
  description?: string;
  backgroundColour?: string;
  userId: string;
  createdAt: string;
  imageUrl?: string;
  status?: "not-started" | "in-progress" | "completed"; 
  timeSpentOnProject?: number; 
  attachments?: string[]; 
};

type ProjectsContextType = {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  refreshProjects: () => Promise<void>;
};

const ProjectsContext = createContext<ProjectsContextType>({
  projects: [],
  setProjects: () => {},
  refreshProjects: async () => {},
});

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();

  useEffect(() => {
    let unsubscribeAuth: () => void;
    let unsubscribeProjects: () => void;

    unsubscribeAuth = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        const notesCollection = collection(db, `users/${user.uid}/projects`);
        const q = query(notesCollection, orderBy("createdAt", "desc"));

        unsubscribeProjects = onSnapshot(q, (snapshot) => {
          const projectsData: Project[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Project, "id">),
          }));
          setProjects(projectsData);
        });
      } else {
        router.push("/login");
      }
    });

    return () => {
      unsubscribeAuth?.();
      unsubscribeProjects?.();
    };
  }, [router]);

  const refreshProjects = async () => {
    return Promise.resolve();
  };

  return (
    <ProjectsContext.Provider value={{ projects, setProjects, refreshProjects }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => useContext(ProjectsContext);

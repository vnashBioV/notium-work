'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Project } from '../types/projects';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchProjects = async () => {
      const projectsRef = collection(db, `users/${user.uid}/projects`);
      const snapshot = await getDocs(projectsRef);
      const projectData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];

      setProjects(projectData);
    };

    fetchProjects();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Projects</h1>
      <ul className="space-y-2">
        {projects.map((project) => (
          <li key={project.id}>
            <button
              onClick={() => router.push(`/dashboard/${project.id}`)}
              className="text-blue-600 hover:underline"
            >
              {project.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

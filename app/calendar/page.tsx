'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { CalendarDays, ChevronLeft, ChevronRight, Menu, Plus } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { useProjects } from '@/context/ProjectsContext';
import { addMinutesToTime, DEFAULT_USER_SETTINGS, loadUserSettings, type UserSettings } from '@/lib/userSettings';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

type StoredCalendarEvent = {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  startAt: string;
  endAt: string;
  color?: string;
  createdAt: string;
};

type CalendarEvent = StoredCalendarEvent & {
  projectId: string;
  projectName: string;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function createEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects } = useProjects();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [infoMessage, setInfoMessage] = useState<string>('');

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(() => formatDateKey(new Date()));
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formProjectId, setFormProjectId] = useState<string>('none');
  const [formColor, setFormColor] = useState('#4D3BED');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (nextUser) {
        setUser(nextUser);
        setSettings(loadUserSettings(nextUser.uid));
      } else {
        router.push('/login');
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const queryProjectId = searchParams.get('projectId');
    if (!queryProjectId) return;
    setProjectFilter(queryProjectId);
    setFormProjectId(queryProjectId);
  }, [searchParams]);

  const events = useMemo<CalendarEvent[]>(() => {
    const nextEvents: CalendarEvent[] = [];

    for (const project of projects) {
      if (!project.id) continue;
      const sourceEvents = project.calendarEvents ?? [];
      for (const event of sourceEvents) {
        nextEvents.push({
          ...event,
          projectId: project.id,
          projectName: project.name,
        });
      }
    }

    nextEvents.sort((a, b) => a.startAt.localeCompare(b.startAt));
    return nextEvents;
  }, [projects]);

  const monthGrid = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstWeekDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: Array<{ dateKey: string; day: number } | null> = [];

    for (let i = 0; i < firstWeekDay; i += 1) grid.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      grid.push({ dateKey: formatDateKey(date), day });
    }
    while (grid.length % 7 !== 0) grid.push(null);

    return grid;
  }, [monthDate]);

  const filteredEvents = useMemo(() => {
    if (projectFilter === 'all') return events;
    return events.filter((event) => event.projectId === projectFilter);
  }, [events, projectFilter]);

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    for (const event of filteredEvents) {
      const list = grouped.get(event.date) ?? [];
      list.push(event);
      grouped.set(event.date, list);
    }
    for (const [, list] of grouped) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return grouped;
  }, [filteredEvents]);

  const selectedDateEvents = eventsByDate.get(selectedDate) ?? [];

  const monthTitle = monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const goToPrevMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const resetForm = () => {
    setEditingEventId(null);
    setEditingProjectId(null);
    setFormTitle('');
    setFormDescription('');
    setFormDate(selectedDate);
    setFormStartTime(settings.defaultEventStartTime);
    setFormEndTime(addMinutesToTime(settings.defaultEventStartTime, settings.defaultEventDurationMinutes));
    setFormProjectId(projectFilter !== 'all' ? projectFilter : 'none');
    setFormColor(settings.defaultEventColor);
    setModalError('');
  };

  const openCreateModal = () => {
    resetForm();
    setEventModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setEditingProjectId(event.projectId);
    setFormTitle(event.title);
    setFormDescription(event.description ?? '');
    setFormDate(event.date);
    setFormStartTime(event.startTime);
    setFormEndTime(event.endTime);
    setFormProjectId(event.projectId);
    setFormColor(event.color ?? '#4D3BED');
    setEventModalOpen(true);
  };

  const closeModal = () => {
    setEventModalOpen(false);
    setEditingEventId(null);
    setEditingProjectId(null);
    setModalError('');
  };

  const persistProjectEvents = async (projectId: string, nextEvents: StoredCalendarEvent[]) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/projects/${projectId}`), {
      calendarEvents: nextEvents,
    });
  };

  const handleSaveEvent = async () => {
    if (!user) return;
    const title = formTitle.trim();

    if (!title) {
      setModalError('Please enter an event title.');
      return;
    }
    if (formProjectId === 'none') {
      setModalError('Please choose a project for this event.');
      return;
    }
    if (formEndTime <= formStartTime) {
      setModalError('End time must be after start time.');
      return;
    }

    const targetProject = projects.find((project) => project.id === formProjectId);
    if (!targetProject?.id) {
      setModalError('Selected project no longer exists.');
      return;
    }

    setSavingEvent(true);
    setInfoMessage('');
    setModalError('');

    const nextEvent: StoredCalendarEvent = {
      id: editingEventId ?? createEventId(),
      title,
      description: formDescription.trim(),
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      startAt: combineDateTime(formDate, formStartTime),
      endAt: combineDateTime(formDate, formEndTime),
      color: formColor,
      createdAt: editingEventId
        ? (events.find((event) => event.id === editingEventId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };

    try {
      const targetEvents = [...(targetProject.calendarEvents ?? [])];

      if (editingEventId && editingProjectId) {
        if (editingProjectId !== targetProject.id) {
          const sourceProject = projects.find((project) => project.id === editingProjectId);
          if (sourceProject?.id) {
            const sourceEvents = (sourceProject.calendarEvents ?? []).filter((event) => event.id !== editingEventId);
            await persistProjectEvents(sourceProject.id, sourceEvents);
          }
          targetEvents.push(nextEvent);
        } else {
          const idx = targetEvents.findIndex((event) => event.id === editingEventId);
          if (idx >= 0) targetEvents[idx] = nextEvent;
          else targetEvents.push(nextEvent);
        }
      } else {
        targetEvents.push(nextEvent);
      }

      await persistProjectEvents(targetProject.id, targetEvents);
      setSelectedDate(formDate);
      setInfoMessage(editingEventId ? 'Event updated.' : 'Event added.');
      closeModal();
    } catch (error) {
      console.error('Failed to save event:', error);
      setInfoMessage('Failed to save event. Try again.');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!user) return;
    if (settings.confirmBeforeDelete && !window.confirm("Delete this event?")) return;
    try {
      const project = projects.find((item) => item.id === event.projectId);
      if (!project?.id) return;
      const nextEvents = (project.calendarEvents ?? []).filter((item) => item.id !== event.id);
      await persistProjectEvents(project.id, nextEvents);
      setInfoMessage('Event deleted.');
    } catch (error) {
      console.error('Failed to delete event:', error);
      setInfoMessage('Failed to delete event.');
    }
  };

  const handleSmartPlanWeek = async () => {
    if (!user) return;
    const activeProjects = projects.filter((project) => project.status !== 'completed' && !!project.id).slice(0, 5);

    if (activeProjects.length === 0) {
      setInfoMessage('No active projects found for auto-planning.');
      return;
    }

    const startCursor = new Date();
    startCursor.setDate(startCursor.getDate() + 1);
    let createdCount = 0;

    try {
      for (const project of activeProjects) {
        if (!project.id) continue;
        while (isWeekend(startCursor)) {
          startCursor.setDate(startCursor.getDate() + 1);
        }

        const dateKey = formatDateKey(startCursor);
        const projectEvents = [...(project.calendarEvents ?? [])];
        const duplicate = projectEvents.some((event) => event.date === dateKey && event.title === 'Focus block');

        if (!duplicate) {
          projectEvents.push({
            id: createEventId(),
            title: 'Focus block',
            description: `Deep work for ${project.name}`,
            date: dateKey,
            startTime: settings.smartPlannerStartTime,
            endTime: addMinutesToTime(settings.smartPlannerStartTime, settings.smartPlannerDurationMinutes),
            startAt: combineDateTime(dateKey, settings.smartPlannerStartTime),
            endAt: combineDateTime(
              dateKey,
              addMinutesToTime(settings.smartPlannerStartTime, settings.smartPlannerDurationMinutes)
            ),
            color: project.backgroundColour ?? settings.defaultEventColor,
            createdAt: new Date().toISOString(),
          });
          await persistProjectEvents(project.id, projectEvents);
          createdCount += 1;
        }

        startCursor.setDate(startCursor.getDate() + 1);
      }

      setInfoMessage(
        createdCount > 0
          ? `Smart planner added ${createdCount} focus block(s).`
          : 'Smart planner found existing blocks and made no changes.'
      );
    } catch (error) {
      console.error('Smart planner failed:', error);
      setInfoMessage('Smart planner failed. Please try again.');
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div role="status">
          <svg aria-hidden="true" className="h-8 w-8 animate-spin fill-blue-600 text-gray-200" viewBox="0 0 100 101">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
          </svg>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white">
      <div className="absolute left-4 top-4 z-50 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white lg:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-800">
          <Menu size={24} />
        </button>
      </div>

      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex min-h-screen flex-1 flex-col p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Calendar</h1>
            <p className="text-sm text-gray-500">Schedule work by project and keep your week balanced.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
            >
              <option value="all">All projects</option>
              {projects
                .filter((project) => !!project.id)
                .map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
            </select>
            <button
              onClick={handleSmartPlanWeek}
              className="rounded-md border border-[#4D3BED] px-3 py-2 text-sm font-semibold text-[#4D3BED] hover:bg-[#4D3BED] hover:text-white active:scale-[0.98] transition-all duration-200"
            >
              Smart Plan Week
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-md bg-[#4D3BED] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={16} />
              Add Event
            </button>
          </div>
        </div>

        {infoMessage && <div className="mb-4 rounded-md bg-[#F2F0FF] px-3 py-2 text-sm text-[#2D1FA8]">{infoMessage}</div>}

        <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
          <section className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <button onClick={goToPrevMonth} className="rounded-md p-2 text-gray-700 hover:bg-gray-100">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-semibold text-black">{monthTitle}</h2>
              <button onClick={goToNextMonth} className="rounded-md p-2 text-gray-700 hover:bg-gray-100">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthGrid.map((cell, index) => {
                if (!cell) {
                  return <div key={`empty-${index}`} className="h-24 rounded-md bg-gray-50" />;
                }

                const dayEvents = eventsByDate.get(cell.dateKey) ?? [];
                const isToday = cell.dateKey === formatDateKey(new Date());
                const isSelected = cell.dateKey === selectedDate;

                return (
                  <button
                    key={cell.dateKey}
                    onClick={() => setSelectedDate(cell.dateKey)}
                    className={`h-24 rounded-md border p-2 text-left transition ${
                      isSelected ? 'border-[#4D3BED] bg-[#F7F4FF]' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isToday ? 'text-[#4D3BED]' : 'text-black'}`}>{cell.day}</span>
                      {dayEvents.length > 0 && <span className="rounded-full bg-[#4D3BED] px-1.5 py-0.5 text-[10px] text-white">{dayEvents.length}</span>}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div key={event.id} className="truncate rounded px-1.5 py-0.5 text-[10px] text-white" style={{ backgroundColor: event.color || '#4D3BED' }}>
                          {event.startTime} {event.title}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-black">{parseDateKey(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                <p className="text-xs text-gray-500">{selectedDateEvents.length} event(s)</p>
              </div>
              <button onClick={openCreateModal} className="rounded-md border border-[#4D3BED] px-2 py-1 text-xs font-semibold text-[#4D3BED] hover:bg-[#4D3BED] hover:text-white">
                New
              </button>
            </div>

            <div className="space-y-2">
              {selectedDateEvents.length === 0 ? (
                <div className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">No events for this date.</div>
              ) : (
                selectedDateEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-black">{event.title}</h4>
                        <p className="text-xs text-gray-500">
                          {event.startTime} - {event.endTime}
                          {event.projectName ? ` | ${event.projectName}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(event)} className="rounded px-2 py-1 text-xs text-[#4D3BED] hover:bg-[#F3F0FF]">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteEvent(event)} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </div>
                    </div>
                    {event.description && <p className="text-xs text-gray-600">{event.description}</p>}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {eventModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.div
              className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">{editingEventId ? 'Edit Event' : 'Add Event'}</h3>
              <CalendarDays size={18} className="text-gray-500" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Title</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
                  placeholder="Sprint review"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Project</label>
                <select
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
                >
                  <option value="none">Select project</option>
                  {projects
                    .filter((project) => !!project.id)
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Start</label>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">End</label>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[#4D3BED]"
                  placeholder="What needs to happen in this session?"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Color</label>
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-9 w-16 rounded border border-gray-300"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              {modalError && (
                <p className="mr-auto text-sm text-red-600">{modalError}</p>
              )}
              <button onClick={closeModal} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all duration-200">
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={savingEvent}
                className="rounded-md bg-[#4D3BED] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                {savingEvent ? 'Saving...' : editingEventId ? 'Save Changes' : 'Add Event'}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

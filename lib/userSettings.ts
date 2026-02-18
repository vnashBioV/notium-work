export type UserSettings = {
  dashboardSearchLimit: number;
  defaultEventStartTime: string;
  defaultEventDurationMinutes: number;
  smartPlannerStartTime: string;
  smartPlannerDurationMinutes: number;
  defaultEventColor: string;
  confirmBeforeDelete: boolean;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  dashboardSearchLimit: 8,
  defaultEventStartTime: "09:00",
  defaultEventDurationMinutes: 60,
  smartPlannerStartTime: "09:00",
  smartPlannerDurationMinutes: 60,
  defaultEventColor: "#4D3BED",
  confirmBeforeDelete: true,
};

function settingsKey(uid: string) {
  return `notium_settings_${uid}`;
}

function toSafeNumber(value: unknown, fallback: number, min: number, max: number) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

function isTimeString(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function normalizeSettings(raw: unknown): UserSettings {
  const input = (raw ?? {}) as Partial<UserSettings>;

  return {
    dashboardSearchLimit: toSafeNumber(input.dashboardSearchLimit, DEFAULT_USER_SETTINGS.dashboardSearchLimit, 3, 20),
    defaultEventStartTime: isTimeString(input.defaultEventStartTime)
      ? input.defaultEventStartTime
      : DEFAULT_USER_SETTINGS.defaultEventStartTime,
    defaultEventDurationMinutes: toSafeNumber(
      input.defaultEventDurationMinutes,
      DEFAULT_USER_SETTINGS.defaultEventDurationMinutes,
      15,
      480
    ),
    smartPlannerStartTime: isTimeString(input.smartPlannerStartTime)
      ? input.smartPlannerStartTime
      : DEFAULT_USER_SETTINGS.smartPlannerStartTime,
    smartPlannerDurationMinutes: toSafeNumber(
      input.smartPlannerDurationMinutes,
      DEFAULT_USER_SETTINGS.smartPlannerDurationMinutes,
      15,
      480
    ),
    defaultEventColor: isHexColor(input.defaultEventColor)
      ? input.defaultEventColor
      : DEFAULT_USER_SETTINGS.defaultEventColor,
    confirmBeforeDelete:
      typeof input.confirmBeforeDelete === "boolean"
        ? input.confirmBeforeDelete
        : DEFAULT_USER_SETTINGS.confirmBeforeDelete,
  };
}

export function loadUserSettings(uid: string): UserSettings {
  if (typeof window === "undefined") return DEFAULT_USER_SETTINGS;

  try {
    const raw = window.localStorage.getItem(settingsKey(uid));
    if (!raw) return DEFAULT_USER_SETTINGS;
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

export function saveUserSettings(uid: string, settings: Partial<UserSettings>): UserSettings {
  const normalized = normalizeSettings(settings);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(settingsKey(uid), JSON.stringify(normalized));
  }
  return normalized;
}

export function resetUserSettings(uid: string): UserSettings {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(settingsKey(uid));
  }
  return DEFAULT_USER_SETTINGS;
}

export function addMinutesToTime(time: string, minutesToAdd: number) {
  const [h, m] = time.split(":").map(Number);
  const total = ((h * 60 + m + minutesToAdd) % (24 * 60) + 24 * 60) % (24 * 60);
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

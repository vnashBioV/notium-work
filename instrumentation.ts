type StorageShape = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  readonly length: number;
};

function createInMemoryStorage(): StorageShape {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value));
    },
    removeItem(key: string) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
  };
}

export function register() {
  if (typeof window !== "undefined") {
    return;
  }

  const currentLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;
  const hasValidGetItem =
    !!currentLocalStorage &&
    typeof (currentLocalStorage as { getItem?: unknown }).getItem === "function";

  if (!hasValidGetItem) {
    Object.defineProperty(globalThis, "localStorage", {
      value: createInMemoryStorage(),
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }
}

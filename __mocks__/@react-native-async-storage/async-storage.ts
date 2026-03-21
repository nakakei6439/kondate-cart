// インメモリ AsyncStorage モック
const store: Record<string, string> = {};

const AsyncStorage = {
  getItem: jest.fn(async (key: string) => store[key] ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete store[key];
  }),
  multiGet: jest.fn(async (keys: string[]) =>
    keys.map((k) => [k, store[k] ?? null] as [string, string | null])
  ),
  multiSet: jest.fn(async (pairs: [string, string][]) => {
    for (const [k, v] of pairs) store[k] = v;
  }),
  clear: jest.fn(async () => {
    for (const key of Object.keys(store)) delete store[key];
  }),
  getAllKeys: jest.fn(async () => Object.keys(store)),
  _store: store,
};

export default AsyncStorage;

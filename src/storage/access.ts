/**
 * DAO para datos de permisos de acceso
 */
import store from "./store";

const KEY = "access";

const get = async (key?: string): Promise<any> => {
  const data = await store.get(KEY);
  if (key && data) {
    return data[key];
  }
  return data;
};

const set = async (data: any): Promise<void> => {
  await store.set(KEY, data);
};

const add = async (id: string, data: any): Promise<void> => {
  const storage = (await get()) || {};
  storage[id] = data;
  await set(storage);
};

const clear = async (): Promise<void> => {
  await store.remove(KEY);
};

export const accessData = {
  get,
  set,
  add,
  clear,
};

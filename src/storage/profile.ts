/**
 * DAO para datos del perfil de usuario
 * Patrón DAO inspirado en sgu-mobile
 */
import store from "./store";

const KEY = "profile";

/**
 * Obtener datos del perfil
 * @param key - Clave específica para obtener (opcional)
 * @returns Datos del perfil o valor específico
 */
const get = async (key?: string): Promise<any> => {
  const data = await store.get(KEY);
  if (key && data) {
    return data[key];
  }
  return data;
};

/**
 * Guardar datos del perfil completos
 * @param data - Datos del perfil a guardar
 */
const set = async (data: any): Promise<void> => {
  await store.set(KEY, data);
};

/**
 * Agregar o actualizar un campo específico del perfil
 * @param id - Identificador del campo
 * @param data - Datos a guardar en ese campo
 */
const add = async (id: string, data: any): Promise<void> => {
  const storage = (await get()) || {};
  storage[id] = data;
  await set(storage);
};

/**
 * Limpiar todos los datos del perfil
 */
const clear = async (): Promise<void> => {
  await store.remove(KEY);
};

export const profileData = {
  get,
  set,
  add,
  clear,
};

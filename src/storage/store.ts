/**
 * Storage centralizado usando Ionic Storage
 * Inspirado en el patrón de sgu-mobile
 */
import { Storage } from "@ionic/storage";

// Crear instancia del storage
const store = new Storage();

/**
 * Inicializar el storage
 * Debe llamarse al inicio de la aplicación
 */
export const initStorage = async (): Promise<void> => {
  await store.create();
};

export default store;

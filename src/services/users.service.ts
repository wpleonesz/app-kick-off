import api from "../lib/api";
import type { User } from "../interfaces";

export async function getUsers(): Promise<User[]> {
  return api.get<User[]>("/api/user");
}

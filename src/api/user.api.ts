import { api } from "./axios";
import { User, UserCreate, UserUpdate } from "../types/user";

/**
 * Create a new user
 * POST /users
 */
export const createUser = async (data: UserCreate): Promise<User> => {
  const response = await api.post<User>("/users", data);
  return response.data;
};

/**
 * Get user by ID
 * GET /users/{id}
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

/**
 * Get user by email
 * GET /users/email/{email}
 */
export const getUserByEmail = async (email: string): Promise<User> => {
  const response = await api.get<User>(`/users/email/${email}`);
  return response.data;
};

/**
 * Update user
 * PATCH /users/{id}
 */
export const updateUser = async (
  id: string,
  updateData: UserUpdate
): Promise<User> => {
  const response = await api.patch<User>(`/users/${id}`, updateData);
  return response.data;
};

/**
 * Soft delete user
 * DELETE /users/{id}
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  const response = await api.delete<{ success: boolean }>(`/users/${id}`);
  return response.data.success;
};

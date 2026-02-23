import { api } from "./axios";
import { User, UserApi, UserCreate, UserUpdate } from "../types/user";


const mapUser = (f: UserApi): User => ({
    id: f._id,
    name: f.name,
    email: f.email,
    is_deleted: f.is_deleted,
    created_at: f.created_at,
    updated_at: f.updated_at,
});

const mapUsers = (fs: UserApi[]): User[] => (fs.map((f: UserApi) => {
  return {
    id: f._id,
    name: f.name,
    email: f.email,
    is_deleted: f.is_deleted,
    created_at: f.created_at,
    updated_at: f.updated_at,
  }
}));

/**
 * Create a new user
 * POST /users
 */
export const createUser = async (data: UserCreate): Promise<User> => {
  const response = await api.post<UserApi>("/users", data);
  return mapUser(response.data);
};

/**
 * Get user by ID
 * GET /users/{id}
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get<UserApi>(`/users/${id}`);
  return mapUser(response.data);
};

/**
 * Get user by email
 * GET /users/email/{email}
 */
export const getUserByEmail = async (email: string): Promise<User> => {
  const response = await api.get<UserApi>(`/users/email/${email}`);
  return mapUser(response.data);
};

/**
 * Update user
 * PATCH /users/{id}
 */
export const updateUser = async (
  id: string,
  updateData: UserUpdate
): Promise<User> => {
  const response = await api.patch<UserApi>(`/users/${id}`, updateData);
  return mapUser(response.data);
};

/**
 * Soft delete user
 * DELETE /users/{id}
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  const response = await api.delete<{ success: boolean }>(`/users/${id}`);
  return response.data.success;
};

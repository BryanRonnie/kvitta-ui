"use client";

import { useState } from "react";
import { createUser, getUserById, deleteUser } from "@/api";
import { UserCreate } from "@/types/user";

/**
 * Example component showing how to use the API layer
 * 
 * Best practices:
 * - Always import from @/api instead of direct files
 * - Use 'use client' directive in components that interact with API
 * - Handle loading and error states
 * - Never expose API logic directly in components
 */

export function UserExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const newUser = await createUser({
        name: "Bryan",
        email: "test@email.com",
        password: "securepassword123",
      } as UserCreate);

      console.log("User created:", newUser);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create user";
      setError(message);
      console.error("Error creating user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchUser = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getUserById(userId);
      console.log("User fetched:", user);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch user";
      setError(message);
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const success = await deleteUser(userId);
      if (success) {
        console.log("User deleted successfully");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete user";
      setError(message);
      console.error("Error deleting user:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleCreateUser} disabled={loading}>
        {loading ? "Loading..." : "Create User"}
      </button>

      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}

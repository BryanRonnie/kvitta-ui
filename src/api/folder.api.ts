import { api } from "./axios";
import { Folder, FolderCreate, FolderUpdate } from "../types/folder";

/* --------------------------
   Create
-------------------------- */
export const createFolder = async (data: FolderCreate): Promise<Folder> => {
  const response = await api.post<Folder>("/folders", data);
  return response.data;
};

/* --------------------------
   List (owner-scoped)
-------------------------- */
export const listFolders = async (
  includeCounts: boolean = false
): Promise<Folder[]> => {
  const response = await api.get<Folder[]>("/folders", {
    params: {
      include_counts: includeCounts,
    },
  });

  return response.data;
};


/* --------------------------
   Get single
-------------------------- */
export const getFolder = async (id: string): Promise<Folder> => {
  const response = await api.get<Folder>(`/folders/${id}`);
  return response.data;
};

/* --------------------------
   Update
-------------------------- */
export const updateFolder = async (
  id: string,
  data: FolderUpdate
): Promise<Folder> => {
  const response = await api.patch<Folder>(`/folders/${id}`, data);
  return response.data;
};

/* --------------------------
   Soft delete
-------------------------- */
export const deleteFolder = async (
  id: string
): Promise<{ success: boolean }> => {
  const response = await api.delete<{ success: boolean }>(`/folders/${id}`);
  return response.data;
};

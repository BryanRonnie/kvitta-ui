export interface FolderCreate {
  name: string;
  color: string;
}

export interface FolderUpdate {
  name?: string;
  color?: string;
}

export interface Folder {
  _id: string;
  name: string;
  color: string;
  owner_id: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

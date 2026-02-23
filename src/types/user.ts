export interface UserCreate {
  name: string;
  email: string;
  password: string;
}

export interface Participants {
  id: string;
  name: string;
  email: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserApi {
  _id: string;
  name: string;
  email: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  password?: string;
}


// Extended User type to include organization_id
export interface User {
  id: string;
  email?: string;
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata?: {
    [key: string]: any;
  };
  role?: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: string;  // This will actually come from profiles table, not directly on User
}

export type AuthUser = {
  id: string;
  email: string;
  user_metadata?: { name?: string };
};

export type AuthSession = {
  access_token: string;
  user: AuthUser;
};

export type AppRole = "administrator" | "it_team" | "employee";

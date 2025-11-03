
export type User_Role = "USER" | "MODERATOR" | "ADMIN";
export type User_Type = "MODEL" | "VOTER";
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  username: string;
  displayUsername?: string;
  role: User_Role;
  type: User_Type
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profileId?: string
}

export interface Session {
  id: string;
  expiresAt: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  ipAddress: string;
  userAgent: string;
  userId: string;
  role: User_Role
  type: User_Type
  profileId?: string
}

export interface SignUpWithEmailRequest {
  name: string
  email: string
  password: string
  username: string
  type?: User_Type
  image?: string | undefined
  callbackURL?: string | null
  rememberMe?: boolean | undefined
  referralCode?: string | undefined
}

export interface SignInWithEmailRequest {
  email: string,
  password: string,
  callbackURL?: string | null,
  rememberMe?: boolean | undefined
}
export interface SignInWithUsernameRequest {
  username: string
  password: string
  callbackURL?: string | null
  rememberMe?: boolean | undefined
}

export interface SignInWithEmailResponse {
  redirect: boolean
  token: string
  url: string | null
  user: User
}

export interface GetSessionResponse {
  user: User
  session: Session
}

// Social sign-in response types
export interface SocialSignInRedirectResponse {
  redirect: true;
  url: string;
  status?: boolean;
}

export interface SocialSignInTokenResponse {
  redirect: false;
  token: string;
  user: User;
  url?: null;
}

export type SocialSignInResponse = SocialSignInRedirectResponse | SocialSignInTokenResponse;

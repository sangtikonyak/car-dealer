export interface AdminUserDto {
  id: string;
  email: string;
  role: string;
}

export interface AuthSessionResult {
  user: AdminUserDto;
  token: string;
  expiresAt: Date;
  sessionId: string;
}

export interface AccessTokenPayload {
  userId: number;
  roleId: number;
  roleName: string;
  exp: number;
  iat: number;
}

export interface RefreshTokenPayload {
  userId: number;
  exp: number;
  iat: number;
}

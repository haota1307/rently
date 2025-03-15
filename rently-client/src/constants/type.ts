export const TokenType = {
  AccessToken: "AccessToken",
  RefreshToken: "RefreshToken",
} as const;

export const Role = {
  Admin: "Admin",
  Landlord: "Landlord",
  Client: "Client",
} as const;

export const RoleValues = [Role.Admin, Role.Landlord, Role.Client] as const;

export type RoleType = (typeof Role)[keyof typeof Role];

export interface IJwt {
  jwtSecret: string;
  jwtAccessTtl: number;
  jwtRefreshTtl: number;
}

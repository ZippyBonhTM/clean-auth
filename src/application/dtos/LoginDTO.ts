export interface LoginRequestDTO {
  email: string,
  password: string;
}

export interface LoginResponseDTO {
  accessToken: string,
  refreshToken: string;
}

export interface RegisterRequestDTO {
  email: string,
  password: string,
  name: string,
}
import type { LoginRequestDTO, LoginResponseDTO } from "../dtos/LoginDTO.js";
import type HashService from '../protocols/HashService.js';
import type TokenService from "../protocols/TokenService.js";
import type UserRepository from "../protocols/UserRepository.js";
import { InvalidCredentialsError } from './errors/InvalidCredentialsError.js';

export class LoginUseCase {
  constructor(
    private userRepo: UserRepository,
    private hashService: HashService,
    private tokenService: TokenService
  ) { }

  async execute(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw new InvalidCredentialsError()

    const valid = await this.hashService.compare(
      dto.password,
      user.getPasswordHash()
    );
    if (!valid) throw new InvalidCredentialsError()

    return {
      accessToken: this.tokenService.generateAccessToken({ id: user.id }),
      refreshToken: this.tokenService.generateRefreshToken({ id: user.id })
    };
  }
}

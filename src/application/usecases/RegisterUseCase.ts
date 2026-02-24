import User from '@/domain/User.js';
import type { LoginResponseDTO, RegisterRequestDTO } from "../dtos/LoginDTO.js";
import type HashService from '../protocols/HashService.js';
import type TokenService from "../protocols/TokenService.js";
import type UserRepository from "../protocols/UserRepository.js";
import { EmailAlreadyInUse } from './errors/EmailAlreadyInUse.js';

export class RegisterUseCase {
  constructor(
    private userRepo: UserRepository,
    private hashService: HashService,
    private tokenService: TokenService
  ) { }

  async execute(dto: RegisterRequestDTO): Promise<LoginResponseDTO> {
    const possibleUser = await this.userRepo.findByEmail(dto.email);
    if (possibleUser) throw new EmailAlreadyInUse() // this must have be refactored

    const newUser = User.create(dto.name, dto.email, await this.hashService.hash(dto.password));

    return {
      accessToken: this.tokenService.generateAccessToken({ id: newUser.id }),
      refreshToken: this.tokenService.generateRefreshToken({ id: newUser.id })
    };
  }
}

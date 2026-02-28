import type JwtService from '@/infrastructure/services/JwtService.js';
import type { UserDTO } from '../dtos/LoginDTO.js';
import toUserDTO from '../mappers/UserMapper.js';
import type UserRepository from '../protocols/UserRepository.js';

export default class ShowProfileUseCase {
  constructor(
    private userRepo: UserRepository,
    private tokenService: JwtService
  ) { }

  async execute(userAccessToken: string): Promise<UserDTO | null> {
    const accessPayload = this.tokenService.verifyAccessToken(userAccessToken);
    if (!accessPayload) return null;

    const user = await this.userRepo.findById(accessPayload.id!);

    if (!user) return null;
    return toUserDTO(user);
  }
}
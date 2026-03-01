import type { ShowProfileResponseDTO } from '../dtos/LoginDTO.js';
import toUserDTO from '../mappers/UserMapper.js';
import type UserRepository from '../protocols/UserRepository.js';
import type ResolveAuthSessionUseCase from './ResolveAuthSessionUseCase.js';

export default class ShowProfileUseCase {
  constructor(
    private userRepo: UserRepository,
    private resolveAuthSessionUseCase: ResolveAuthSessionUseCase
  ) { }

  async execute(accessToken: string, refreshToken: string): Promise<ShowProfileResponseDTO | null> {
    const session = this.resolveAuthSessionUseCase.execute(accessToken, refreshToken);

    const user = await this.userRepo.findById(session.userId);

    if (!user) return null;

    const response: ShowProfileResponseDTO = {
      userProfile: toUserDTO(user),
      accessToken: session.accessToken
    };

    if (session.refreshToken) response.refreshToken = session.refreshToken;
    return response;
  }
}

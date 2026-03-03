import type UserRepository from '@/application/protocols/UserRepository.js';
import { LoginUseCase } from '@/application/usecases/LoginUseCase.js';
import { RegisterUseCase } from '@/application/usecases/RegisterUseCase.js';
import ResolveAuthSessionUseCase from '@/application/usecases/ResolveAuthSessionUseCase.js';
import ShowProfileUseCase from '@/application/usecases/ShowProfileUseCase.js';
import ValidateAccessTokenUseCase from '@/application/usecases/ValidateAccessTokenUseCase.js';
import LocalUserRepository from '@/infrastructure/repositories/LocalUserRepository.js';
import MongoUserRepository from '@/infrastructure/repositories/MongoUserRepository.js';
import BcryptHashService from '@/infrastructure/services/BcriptHashService.js';
import JwtService from '@/infrastructure/services/JwtService.js';

type UserDataSource = 'memory' | 'mongo';

function resolveDataSource(): UserDataSource {
  const configured = process.env.DATA_SOURCE;

  if (configured === undefined || configured.trim().length === 0) {
    return 'memory';
  }

  if (configured === 'memory' || configured === 'mongo') {
    return configured;
  }

  throw new Error('Invalid DATA_SOURCE. Use memory | mongo.');
}

function createUserRepository(): UserRepository {
  if (resolveDataSource() === 'mongo') {
    return new MongoUserRepository();
  }

  return new LocalUserRepository();
}

const userRepository = createUserRepository();
const bcryptHashService = new BcryptHashService();
const jwtService = new JwtService();

const resolveAuthSessionUseCase = new ResolveAuthSessionUseCase(jwtService);
const validateAccessTokenUseCase = new ValidateAccessTokenUseCase(jwtService);

export const loginUseCase = new LoginUseCase(userRepository, bcryptHashService, jwtService);
export const registerUseCase = new RegisterUseCase(userRepository, bcryptHashService, jwtService);
export const showProfileUseCase = new ShowProfileUseCase(userRepository, resolveAuthSessionUseCase);
export { validateAccessTokenUseCase };

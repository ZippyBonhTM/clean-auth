import { LoginUseCase } from '@/application/usecases/LoginUseCase.js';
import BcryptHashService from '@/infrastructure/services/BcriptHashService.js';
import LocalUserRepository from '@/infrastructure/repositories/LocalUserRepository.js';
import JwtService from '@/infrastructure/services/JwtService.js';
import { RegisterUseCase } from '@/application/usecases/RegisterUseCase.js';

const localUserRepository = new LocalUserRepository();
const bcryptHashService = new BcryptHashService();
const jwtService = new JwtService()

export const loginUseCase = new LoginUseCase(localUserRepository, bcryptHashService, jwtService);
export const registerUseCase = new RegisterUseCase(localUserRepository, bcryptHashService, jwtService);


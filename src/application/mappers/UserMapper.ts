import type User from '@/domain/User.js';
import type { UserDTO } from '../dtos/LoginDTO.js';

export default function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}
import type UserRepository from "@/application/protocols/UserRepository.js";
import type {
  ListUserIdentitiesResult,
  UserIdentitySummary,
} from "@/application/protocols/UserRepository.js";

type ExecuteInput = {
  cursor?: string | null;
  limit?: number;
};

type ExecuteResult = {
  items: UserIdentitySummary[];
  nextCursor: string | null;
};

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function normalizeCursor(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function normalizeLimit(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_PAGE_SIZE;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new Error("limit must be a positive integer.");
  }

  return Math.min(value, MAX_PAGE_SIZE);
}

export default class ListInternalUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ExecuteInput = {}): Promise<ExecuteResult> {
    const result: ListUserIdentitiesResult = await this.userRepository.listIdentities({
      cursor: normalizeCursor(input.cursor),
      limit: normalizeLimit(input.limit),
    });

    return {
      items: result.items,
      nextCursor: result.nextCursor,
    };
  }
}

export type { ExecuteInput as ListInternalUsersInput, ExecuteResult as ListInternalUsersResult };

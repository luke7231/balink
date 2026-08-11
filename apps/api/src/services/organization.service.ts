import type { OrganizationDetail } from "@balink/domain";
import { OrganizationRepository } from "@balink/db";

export class OrganizationService {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async findById(id: string): Promise<OrganizationDetail | null> {
    return this.organizationRepository.findById(id);
  }
}

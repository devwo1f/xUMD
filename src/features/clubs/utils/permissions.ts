import { MemberRole } from '../../../shared/types';

export interface ClubPermissionSet {
  role: MemberRole | null;
  roleLabel: string;
  isMember: boolean;
  canPost: boolean;
  canAnnounce: boolean;
  canUploadMedia: boolean;
  canApproveRequests: boolean;
  canManageMembers: boolean;
  canPromoteMembers: boolean;
  canTransferOwnership: boolean;
}

const roleLabels: Record<MemberRole, string> = {
  [MemberRole.Member]: 'Member',
  [MemberRole.Officer]: 'Co-admin',
  [MemberRole.Admin]: 'Admin',
  [MemberRole.President]: 'Owner',
};

export function getRoleLabel(role: MemberRole | null | undefined): string {
  if (!role) {
    return 'Visitor';
  }

  return roleLabels[role];
}

export function getClubPermissions(role: MemberRole | null | undefined): ClubPermissionSet {
  const resolvedRole = role ?? null;
  const isOfficer = resolvedRole === MemberRole.Officer;
  const isAdmin = resolvedRole === MemberRole.Admin;
  const isPresident = resolvedRole === MemberRole.President;
  const isMember = Boolean(resolvedRole);

  return {
    role: resolvedRole,
    roleLabel: getRoleLabel(resolvedRole),
    isMember,
    canPost: isOfficer || isAdmin || isPresident,
    canAnnounce: isOfficer || isAdmin || isPresident,
    canUploadMedia: isOfficer || isAdmin || isPresident,
    canApproveRequests: isOfficer || isAdmin || isPresident,
    canManageMembers: isAdmin || isPresident,
    canPromoteMembers: isAdmin || isPresident,
    canTransferOwnership: isPresident,
  };
}

export function getAssignableRoles(
  actorRole: MemberRole | null | undefined,
  targetRole: MemberRole | null | undefined,
  currentUserId: string,
  targetUserId: string,
): MemberRole[] {
  if (!actorRole || currentUserId === targetUserId) {
    return [];
  }

  if (targetRole === MemberRole.President) {
    return [];
  }

  if (actorRole === MemberRole.President) {
    return [MemberRole.Member, MemberRole.Officer, MemberRole.Admin].filter((role) => role !== targetRole);
  }

  if (actorRole === MemberRole.Admin) {
    if (targetRole === MemberRole.Admin) {
      return [];
    }

    return [MemberRole.Member, MemberRole.Officer].filter((role) => role !== targetRole);
  }

  return [];
}

export function canRemoveClubMember(
  actorRole: MemberRole | null | undefined,
  targetRole: MemberRole | null | undefined,
  currentUserId: string,
  targetUserId: string,
): boolean {
  if (!actorRole || currentUserId === targetUserId) {
    return false;
  }

  if (targetRole === MemberRole.President) {
    return false;
  }

  if (actorRole === MemberRole.President) {
    return true;
  }

  if (actorRole === MemberRole.Admin) {
    return targetRole === MemberRole.Member || targetRole === MemberRole.Officer;
  }

  return false;
}

export function canTransferOwnership(
  actorRole: MemberRole | null | undefined,
  currentUserId: string,
  targetUserId: string,
): boolean {
  return actorRole === MemberRole.President && currentUserId !== targetUserId;
}

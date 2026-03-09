const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export interface SplitSolQrPayloadBase {
  app: 'splitsol';
  type: 'member' | 'group_invite';
}

export interface SplitSolMemberQrPayload {
  app: 'splitsol';
  type: 'member';
  name: string;
  wallet: string;
}

export interface SplitSolGroupInviteQrPayload {
  app: 'splitsol';
  type: 'group_invite';
  groupId: string;
  inviteCode: string;
  groupName: string;
}

export type SplitSolQrPayload = SplitSolMemberQrPayload | SplitSolGroupInviteQrPayload;

export const buildGroupInviteQrPayload = (
  groupId: string,
  inviteCode: string,
  groupName: string,
): string => {
  return JSON.stringify({
    app: 'splitsol',
    type: 'group_invite',
    groupId,
    inviteCode,
    groupName,
  } satisfies SplitSolGroupInviteQrPayload);
};

export const isValidWalletAddress = (value: string): boolean => {
  return SOLANA_ADDRESS_REGEX.test(value);
};

export const buildMemberQrPayload = (
  name: string,
  wallet: string,
): string => {
  return JSON.stringify({
    app: 'splitsol',
    type: 'member',
    name: name.trim(),
    wallet,
  } satisfies SplitSolMemberQrPayload);
};

export const parseMemberQrPayload = (
  rawValue: string,
): SplitSolMemberQrPayload | null => {
  const parsed = parseSplitSolQrPayload(rawValue);
  return parsed?.type === 'member' ? parsed : null;
};

// Spec-named aliases
export const encodeMemberQR = buildMemberQrPayload;
export const decodeMemberQR = parseMemberQrPayload;

export const parseSplitSolQrPayload = (
  rawValue: string,
): SplitSolQrPayload | null => {
  try {
    const parsed = JSON.parse(rawValue) as Record<string, string | undefined>;

    if (parsed.app !== 'splitsol') return null;

    if (parsed.type === 'group_invite') {
      const groupId = parsed.groupId?.trim();
      const inviteCode = parsed.inviteCode?.trim();
      const groupName = parsed.groupName?.trim() ?? '';
      if (!groupId || !inviteCode) return null;
      return { app: 'splitsol', type: 'group_invite', groupId, inviteCode, groupName };
    }

    // Accept both 'member' and 'contact' for backward compatibility with existing QR codes
    const isValidType = parsed.type === 'member' || parsed.type === 'contact';
    const name = parsed.name?.trim();
    const wallet = parsed.wallet?.trim();

    if (!isValidType || !name || !wallet || !isValidWalletAddress(wallet)) {
      return null;
    }

    return {
      app: 'splitsol',
      type: 'member',
      name: name.slice(0, 20),
      wallet,
    };
  } catch {
    return null;
  }
};

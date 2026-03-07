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

export type SplitSolQrPayload = SplitSolMemberQrPayload;

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

export const parseSplitSolQrPayload = (
  rawValue: string,
): SplitSolQrPayload | null => {
  try {
    const parsed = JSON.parse(rawValue) as Partial<SplitSolMemberQrPayload & { type: string }>;
    const name = parsed.name?.trim();
    const wallet = parsed.wallet?.trim();

    // Accept both 'member' and 'contact' for backward compatibility with existing QR codes
    const isValidType = parsed.type === 'member' || parsed.type === 'contact';

    if (
      parsed.app !== 'splitsol' ||
      !isValidType ||
      !name ||
      !wallet ||
      !isValidWalletAddress(wallet)
    ) {
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

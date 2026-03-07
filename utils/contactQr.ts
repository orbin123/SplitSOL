const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export interface SplitSolContactQrPayload {
  app: 'splitsol';
  type: 'contact';
  name: string;
  wallet: string;
}

export const isValidWalletAddress = (value: string): boolean => {
  return SOLANA_ADDRESS_REGEX.test(value);
};

export const buildContactQrPayload = (
  name: string,
  wallet: string,
): string => {
  return JSON.stringify({
    app: 'splitsol',
    type: 'contact',
    name: name.trim(),
    wallet,
  } satisfies SplitSolContactQrPayload);
};

export const parseContactQrPayload = (
  rawValue: string,
): SplitSolContactQrPayload | null => {
  try {
    const parsed = JSON.parse(rawValue) as Partial<SplitSolContactQrPayload>;
    const name = parsed.name?.trim();
    const wallet = parsed.wallet?.trim();

    if (
      parsed.app !== 'splitsol' ||
      parsed.type !== 'contact' ||
      !name ||
      !wallet ||
      !isValidWalletAddress(wallet)
    ) {
      return null;
    }

    return {
      app: 'splitsol',
      type: 'contact',
      name: name.slice(0, 20),
      wallet,
    };
  } catch {
    return null;
  }
};

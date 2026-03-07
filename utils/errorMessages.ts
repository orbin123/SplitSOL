import { SOLANA } from './constants';

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
};

export const isWalletInstallError = (error: unknown): boolean => {
  const message = normalizeErrorMessage(error).toLowerCase();

  return (
    message.includes('no wallet') ||
    message.includes('not installed') ||
    message.includes('mwa') ||
    message.includes('wallet not found')
  );
};

export const isUserRejectedError = (error: unknown): boolean => {
  const message = normalizeErrorMessage(error).toLowerCase();
  return message.includes('user rejected') || message.includes('rejected');
};

export const isTimeoutError = (error: unknown): boolean => {
  const message = normalizeErrorMessage(error).toLowerCase();
  return message.includes('timeout') || message.includes('aborted');
};

export const isInsufficientFundsError = (error: unknown): boolean => {
  const message = normalizeErrorMessage(error).toLowerCase();
  return message.includes('insufficient');
};

export const isRpcConnectionError = (error: unknown): boolean => {
  const message = normalizeErrorMessage(error).toLowerCase();

  return (
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('fetch failed') ||
    message.includes('rpc') ||
    message.includes('503') ||
    message.includes('429') ||
    isTimeoutError(error)
  );
};

export const getWalletConnectionErrorCopy = (error: unknown) => {
  if (isUserRejectedError(error)) {
    return {
      title: 'Connection Rejected',
      message: 'Approve the wallet request in Phantom to continue.',
      showInstallAction: false,
    };
  }

  if (isWalletInstallError(error)) {
    return {
      title: 'Phantom Required',
      message:
        'Phantom is not available on this device. Install it, then come back and try again.',
      showInstallAction: true,
    };
  }

  if (isRpcConnectionError(error)) {
    return {
      title: 'Network Unavailable',
      message: `We couldn't reach Solana ${SOLANA.CLUSTER}. Check your connection and try again.`,
      showInstallAction: false,
    };
  }

  return {
    title: 'Connection Failed',
    message: 'We could not connect your wallet right now. Please try again.',
    showInstallAction: false,
  };
};

export const getRpcErrorCopy = (error: unknown) => {
  if (isTimeoutError(error)) {
    return {
      title: 'Solana Is Slow Right Now',
      message: 'The network is taking longer than expected. Please try again in a moment.',
    };
  }

  return {
    title: 'Connection Error',
    message: `We couldn't reach Solana ${SOLANA.CLUSTER}. Check your internet connection and try again.`,
  };
};

export const getSettlementPreparationErrorCopy = (error: unknown) => {
  const message = normalizeErrorMessage(error);

  if (message.includes('No supported token balances')) {
    return {
      title: 'No Available Tokens',
      message:
        "We couldn't find enough spendable SOL or USDC in your wallet for this payment.",
    };
  }

  if (message.includes('No Jupiter swap route')) {
    return {
      title: 'AutoPay Unavailable',
      message:
        'No swap route is available right now for the assets in your wallet. Try again later or fund USDC directly.',
    };
  }

  if (isRpcConnectionError(error)) {
    return {
      title: 'Network Unavailable',
      message: `We couldn't prepare the payment because Solana ${SOLANA.CLUSTER} is unreachable right now.`,
    };
  }

  return {
    title: 'Payment Prep Failed',
    message: 'We could not prepare this settlement. Please try again.',
  };
};

export const getSettlementExecutionErrorCopy = (error: unknown) => {
  if (isUserRejectedError(error)) {
    return {
      title: 'Payment Cancelled',
      message: 'You rejected the transaction in Phantom.',
    };
  }

  if (isInsufficientFundsError(error)) {
    return {
      title: 'Insufficient Funds',
      message:
        "You don't have enough tokens or SOL to complete this settlement and cover network fees.",
    };
  }

  if (isRpcConnectionError(error)) {
    return {
      title: 'Network Timeout',
      message: 'Solana is busy right now. Try the payment again in a moment.',
    };
  }

  return {
    title: 'Settlement Failed',
    message: 'Something went wrong while confirming the settlement. Please try again.',
  };
};

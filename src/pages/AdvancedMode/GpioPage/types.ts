export interface GpioPin {
  nr: number;
  boardId: number;
  inUse: boolean;
  pinName?: string;
}

export interface GpioBoard {
  id: number;
  name: string;
  type: 'local' | 'i2c';
  boardModel?: string;
  address?: number;
  pins?: GpioPin[];
}

export interface GpioStatus {
  pinsUsed: number;
  maxPins: number;
  boardsInstalled: number;
  statusesAvailable: number;
}

export const I2C_BOARD_MODELS = [
  'PCF8574',
  'PCF8574A',
  'PCF8575',
  'MCP23008',
  'MCP23017',
] as const;

export const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
};

export const formatAddress = (address?: number): string =>
  address === undefined || address === null
    ? '-'
    : `0x${address.toString(16).toUpperCase().padStart(2, '0')}`;

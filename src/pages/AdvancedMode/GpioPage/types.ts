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
  { value: 'MCP23017', label: 'MCP23017' },
  { value: 'XL9535_K1V5_RELAY', label: 'XL9535-K1V5' },
  { value: 'XL9535_K2V5_RELAY', label: 'XL9535-K2V5' },
  { value: 'XL9535_K4V5_RELAY', label: 'XL9535-K4V5' },
  { value: 'XL9535_K8V5_RELAY', label: 'XL9535-K8V5' },
  { value: 'XL9535_K16V5_RELAY', label: 'XL9535-K16V5' },
] as const;

export const i2cModelLabel = (model?: string): string =>
  I2C_BOARD_MODELS.find((m) => m.value === model)?.label ?? model ?? '';

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

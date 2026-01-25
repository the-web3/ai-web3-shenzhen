// AI Response Types
export interface AIResponse {
  problem?: ProblemAnalysis;
  operation?: Operation;
  supplement?: Supplement;
  form?: FormInput; // NEW: Form input UI
}

export interface ProblemAnalysis {
  type: 'warning' | 'info' | 'error';
  title: string;
  description: string;
  suggestions?: string[];
}

export interface Operation {
  action: string;
  asset?: string;
  amount?: number;
  recipient?: string;
  chainId?: number;
  gasEstimate?: string;
  parameters?: Record<string, any>;
}

export interface Supplement {
  priceData?: {
    symbol: string;
    currentPrice: number;
    change24h: number;
  };
  news?: NewsItem[];
  riskScore?: number;
  alternatives?: string[];
}

export interface FormInput {
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  value?: string;
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[] | string[]; // Support both formats
  validation?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface NewsItem {
  title: string;
  summary: string;
  url?: string;
  timestamp: string;
}

// Chain Types
export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  nativeCoin: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

// Transfer Types
export interface TransferRequest {
  chainId: number;
  recipient: string;
  amount: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  estimatedCost: string;
  estimatedCostEth: string;
  chainSymbol: string;
}

export interface TransferResult {
  txHash: string;
  chainId: number;
  from: string;
  to: string;
  amount: string;
  status: string;
  explorerUrl: string;
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  aiResponse?: AIResponse;
  timestamp: Date;
}

// UI Component Types
export interface JSONUIComponentProps {
  data: AIResponse;
  onConfirm: (operation: Operation) => void;
  onCancel: () => void;
  onFormSubmit?: (formData: Record<string, any>) => void; // NEW: Form submit handler
  isProcessed?: boolean; // NEW: Whether operation has been confirmed/cancelled
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  parts?: Array<any>;
  function_calls?: FunctionCallResult[];
}

export interface FunctionCallResult {
  name: string;
  args: Record<string, any>;
  result: any;
}

export interface ChatResponse {
  response: string;
  parts?: Array<any>;
  function_calls?: FunctionCallResult[];
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  chunk_index: number;
  similarity: number;
  metadata?: Record<string, any>;
}

export const PROMPT_VERSION_PATTERN = '<domain>.<task>.v<major>.<minor>.<patch>';

export interface PromptVariableSpec {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
}

import { zhCN } from './zh-CN';

type TranslationTree = typeof zhCN;
type DotPrefix<TPrefix extends string, TKey extends string> = TPrefix extends '' ? TKey : `${TPrefix}.${TKey}`;
type DotPaths<T, TPrefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? DotPrefix<TPrefix, K>
    : T[K] extends Record<string, unknown>
      ? DotPaths<T[K], DotPrefix<TPrefix, K>>
      : never;
}[keyof T & string];

export type I18nKey = DotPaths<TranslationTree>;

export function t(key: I18nKey, params?: Record<string, string | number>): string {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, zhCN);

  const template = typeof value === 'string' ? value : key;
  return Object.entries(params ?? {}).reduce(
    (text, [name, paramValue]) => text.replaceAll(`{${name}}`, String(paramValue)),
    template,
  );
}

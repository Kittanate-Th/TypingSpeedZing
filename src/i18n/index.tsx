import { createContext, useContext, useMemo } from "react";
import type { Lang } from "../types";
import en, { type TranslationKey } from "./en";
import th from "./th";

const dictionaries = { en, th } as const;

interface I18nContextValue {
  lang: Lang;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  t: (key) => dictionaries.en[key],
});

export function I18nProvider({ lang = "en", children }: { lang?: Lang; children: React.ReactNode }) {
  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[lang];
    return { lang, t: (key) => dictionary[key] };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): (key: TranslationKey) => string {
  return useContext(I18nContext).t;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

export type { TranslationKey };

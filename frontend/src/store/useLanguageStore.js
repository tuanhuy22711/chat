import { create } from "zustand";
import { persist } from "zustand/middleware";
import enTranslations from "../locales/en.json";
import viTranslations from "../locales/vi.json";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: "en", 
      translations: translations,

      setLanguage: (lang) => {
        set({ language: lang });
      },

      t: (key) => {
        const { language, translations } = get();
        const keys = key.split(".");
        let value = translations[language];

        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = value[k];
          } else {
            // Fallback to English if key not found
            value = translations.en;
            for (const fallbackKey of keys) {
              if (value && typeof value === "object" && fallbackKey in value) {
                value = value[fallbackKey];
              } else {
                return key; // Return key if translation not found
              }
            }
            break;
          }
        }

        return typeof value === "string" ? value : key;
      },

      getCurrentLanguage: () => {
        return get().language;
      },

      getAvailableLanguages: () => {
        return [
          { code: "en", name: "English", nativeName: "English" },
          { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
        ];
      },
    }),
    {
      name: "language-storage",
      partialize: (state) => ({ language: state.language }),
    }
  )
);

import { useLanguageStore } from '../store/useLanguageStore';

export const useTranslation = () => {
  const { t, language, setLanguage, getAvailableLanguages } = useLanguageStore();
  
  return {
    t,
    language,
    setLanguage,
    getAvailableLanguages,
  };
};

export default useTranslation;

import React from "react";
import { useLanguageStore } from "../store/useLanguageStore";
import { Globe } from "lucide-react";

const LanguageSelector = ({ className = "" }) => {
  const { language, setLanguage, getAvailableLanguages, t } = useLanguageStore();
  const languages = getAvailableLanguages();

  return (
    <div className={`dropdown dropdown-end ${className}`}>
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <Globe size={20} />
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
      >
        <li className="menu-title">
          <span>{t("settings.language")}</span>
        </li>
        {languages.map((lang) => (
          <li key={lang.code}>
            <a
              onClick={() => setLanguage(lang.code)}
              className={`${language === lang.code ? "active" : ""}`}
            >
              <span className="flex items-center justify-between w-full">
                <span>{lang.nativeName}</span>
                {language === lang.code && (
                  <span className="text-primary">✓</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LanguageSelector;

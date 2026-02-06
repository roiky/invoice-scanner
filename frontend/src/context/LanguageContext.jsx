import React, { createContext, useState, useContext, useEffect } from 'react';
import { en } from '../translations/en';
import { he } from '../translations/he';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Try to get language from localStorage, default to 'en'
    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem('language');
        return saved || 'en';
    });

    const setLanguage = (lang) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    // Derived values
    const translations = language === 'he' ? he : en;
    const dir = language === 'he' ? 'rtl' : 'ltr';

    useEffect(() => {
        // Update document direction and lang attribute
        document.documentElement.dir = dir;
        document.documentElement.lang = language;

        // Optional: Toggle classes on body for font switching if needed
        if (language === 'he') {
            document.body.classList.add('font-hebrew');
        } else {
            document.body.classList.remove('font-hebrew');
        }
    }, [language, dir]);

    const t = (path) => {
        return path.split('.').reduce((obj, key) => obj?.[key], translations) || path;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

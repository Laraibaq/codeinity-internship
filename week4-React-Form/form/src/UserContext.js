import React, { createContext, useState } from 'react';

// Create Theme & User Preference Context
export const ThemeUserContext = createContext();

export function ThemeUserProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [userProfile, setUserProfile] = useState({
    username: 'GuestUser',
    language: 'English',
    notifications: true,
  });

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const updateUserProfile = (newProfile) => {
    setUserProfile((prev) => ({ ...prev, ...newProfile }));
  };

  return (
    <ThemeUserContext.Provider
      value={{
        theme,
        toggleTheme,
        userProfile,
        updateUserProfile,
      }}
    >
      {children}
    </ThemeUserContext.Provider>
  );
}

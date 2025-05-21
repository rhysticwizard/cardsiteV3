import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface ProfileContextType {
  avatarSrc: string | null;
  setAvatarSrc: (src: string | null) => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
}

const defaultContext: ProfileContextType = {
  avatarSrc: null,
  setAvatarSrc: () => {},
  userName: 'User Name',
  setUserName: () => {},
  userEmail: 'user@example.com',
  setUserEmail: () => {},
};

const ProfileContext = createContext<ProfileContextType>(defaultContext);

export const useProfile = () => useContext(ProfileContext);

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [avatarSrc, setAvatarSrcState] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string>('User Name');
  const [userEmail, setUserEmailState] = useState<string>('user@example.com');
  
  // Load profile data from localStorage on initial render
  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      try {
        const profileData = JSON.parse(storedProfile);
        if (profileData.avatarSrc) setAvatarSrcState(profileData.avatarSrc);
        if (profileData.userName) setUserNameState(profileData.userName);
        if (profileData.userEmail) setUserEmailState(profileData.userEmail);
      } catch (error) {
        console.error('Error parsing profile data:', error);
      }
    }
  }, []);
  
  // Update localStorage whenever profile data changes
  const setAvatarSrc = (src: string | null) => {
    setAvatarSrcState(src);
    updateLocalStorage('avatarSrc', src);
  };
  
  const setUserName = (name: string) => {
    setUserNameState(name);
    updateLocalStorage('userName', name);
  };
  
  const setUserEmail = (email: string) => {
    setUserEmailState(email);
    updateLocalStorage('userEmail', email);
  };
  
  const updateLocalStorage = (key: string, value: any) => {
    try {
      const storedProfile = localStorage.getItem('userProfile');
      const profileData = storedProfile ? JSON.parse(storedProfile) : {};
      
      profileData[key] = value;
      localStorage.setItem('userProfile', JSON.stringify(profileData));
    } catch (error) {
      console.error('Error updating profile data:', error);
    }
  };
  
  return (
    <ProfileContext.Provider 
      value={{ 
        avatarSrc, 
        setAvatarSrc, 
        userName, 
        setUserName, 
        userEmail, 
        setUserEmail 
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileContext; 
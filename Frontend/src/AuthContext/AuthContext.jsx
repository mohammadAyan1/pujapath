import { createContext, useContext, useState } from "react";
// 1. Create context
const AuthContext = createContext();

// 2. Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoginCheck, setIsLoginCheck] = useState(false);

  return (
    <AuthContext.Provider
      value={{ user, setUser, isLoginCheck, setIsLoginCheck }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook (BEST PRACTICE)
export const useAuth = () => {
  return useContext(AuthContext);
};

import React from "react";

const defaultEnv = {
  VITE_SERVER_API_URL: "",
};

const env =
  typeof window !== "undefined" && window.__ENV__
    ? window.__ENV__
    : defaultEnv;

export const EnvContext = React.createContext(env);

export const EnvProvider = ({ children }) => {
  

  return (
    <EnvContext.Provider value={env}>
      {children}
    </EnvContext.Provider>
  );
};
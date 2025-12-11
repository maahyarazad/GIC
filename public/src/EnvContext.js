import React from "react";

const defaultEnv = {
  VITE_SERVER_API_URL: "",
};

const isBrowser = typeof window !== "undefined";

const env = isBrowser && window.__ENV__ ? window.__ENV__ : defaultEnv;

export const EnvContext = React.createContext(env);
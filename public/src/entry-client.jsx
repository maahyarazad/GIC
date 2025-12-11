import './index.css'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import App from './App'
import { EnvContext } from "./EnvContext";
import { RootProviders } from "./RootProviders";
hydrateRoot(
  document.getElementById('root'),
  <StrictMode>


    <RootProviders>

      <App />
    </RootProviders>
  </StrictMode>
)
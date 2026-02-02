import './index.css'

import { hydrateRoot } from 'react-dom/client'
import App from './App'

import { RootProviders } from "./RootProviders";
const preloadedState = window.__PRELOADED_STATE__;
delete window.__PRELOADED_STATE__;

hydrateRoot(
  document.getElementById('root'),
  <>


    <RootProviders>

      <App />
    </RootProviders>
  </>
)
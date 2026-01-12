import './index.css'

import { hydrateRoot } from 'react-dom/client'
import App from './App'

import { RootProviders } from "./RootProviders";
hydrateRoot(
  document.getElementById('root'),
  <>


    <RootProviders>

      <App />
    </RootProviders>
  </>
)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AppWithCustomization } from './AppWithCustomization'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
   <StrictMode>
      <AppWithCustomization>
         <App />
      </AppWithCustomization>
   </StrictMode>
)

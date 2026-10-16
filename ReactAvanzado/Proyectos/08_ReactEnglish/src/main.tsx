import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AppServicesProvider } from './presentation/context/AppServicesProvider'
import { appServices } from './app/composition'
import './index.css'

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppServicesProvider services={appServices}>
        <App />
      </AppServicesProvider>
    </React.StrictMode>
  )
}

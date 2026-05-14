import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

const MIKUScriptUrl = import.meta.env.VITE_MIKU_SCRIPT_URL
const MIKUWebsiteId = import.meta.env.VITE_MIKU_WEBSITE_ID

if (MIKUScriptUrl && MIKUWebsiteId) {
  const script = document.createElement('script')
  script.defer = true
  script.src = MIKUScriptUrl
  script.setAttribute('data-website-id', MIKUWebsiteId)
  document.head.appendChild(script)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
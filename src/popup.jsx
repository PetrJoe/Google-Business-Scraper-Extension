import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PopupApp from './components/PopupApp'
import './styles/popup.css'

const root = createRoot(document.getElementById('popup-root'))
root.render(
  <StrictMode>
    <PopupApp />
  </StrictMode>
)
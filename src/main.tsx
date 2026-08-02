import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import TaskCPreview from './ui/TaskCPreview'

const taskCPreview = new URLSearchParams(window.location.search).get('task-c-preview') === '1'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {taskCPreview ? <TaskCPreview /> : <App />}
    </BrowserRouter>
  </StrictMode>,
)

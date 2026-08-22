import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

if (!window.api) {
  const mockFiles: Record<string, { path: string; name: string; isDir: boolean }[]> = {
    '/workspace': [
      { path: '/workspace/images', name: 'images', isDir: true },
      { path: '/workspace/tools', name: 'tools', isDir: true },
      { path: '/workspace/third_party', name: 'third_party', isDir: true },
      { path: '/workspace/sqlite3', name: 'sqlite3', isDir: true },
      { path: '/workspace/team.css', name: 'team.css', isDir: false },
      { path: '/workspace/main.html', name: 'main.html', isDir: false },
      { path: '/workspace/ngrok.exe', name: 'ngrok.exe', isDir: false },
      { path: '/workspace/product.json', name: 'product.json', isDir: false }
    ],
    '/workspace/tools': [
      { path: '/workspace/tools/mailer.php', name: 'mailer.php', isDir: false },
      { path: '/workspace/tools/main.js', name: 'main.js', isDir: false },
      { path: '/workspace/tools/script.py', name: 'script.py', isDir: false },
      { path: '/workspace/tools/index.css', name: 'index.css', isDir: false }
    ],
    '/workspace/images': [],
    '/workspace/third_party': [],
    '/workspace/sqlite3': []
  }

  // @ts-ignore - Browser fallback mock API when running outside Electron container
  window.api = {
    fs: {
      openDirectory: () => Promise.resolve({ path: '/workspace', name: 'workspace' }),
      readDirectory: (dirPath: string) => Promise.resolve(mockFiles[dirPath] || []),
      readFile: () => Promise.resolve('// Sample File Content\n'),
      writeFile: () => Promise.resolve(),
      createFile: (dir: string, name: string) => Promise.resolve(`${dir}/${name}`),
      createFolder: (dir: string, name: string) => Promise.resolve(`${dir}/${name}`),
      deletePath: () => Promise.resolve(),
      renamePath: () => Promise.resolve(),
      showItemInFolder: () => Promise.resolve(true),
      showSaveDialog: () => Promise.resolve('/workspace/untitled.md'),
      watchDirectory: () => Promise.resolve(),
      closeWatcher: () => Promise.resolve(),
      getGraphData: () => Promise.resolve({ nodes: [], links: [] }),
      onWorkspaceChanged: () => () => {}
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

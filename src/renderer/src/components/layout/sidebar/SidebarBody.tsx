import React from 'react'
import FileTree from '../../FileTree'
import PluginsWidget from '../PluginsWidget'
import SidebarSearch from './SidebarSearch'
import SidebarEmptyState from './SidebarEmptyState'

export type SidebarViewMode = 'explorer' | 'plugins'

interface SidebarBodyProps {
  activeView: SidebarViewMode
  workspacePath: string | null
  activeFilePath: string | null
  showSearchInput: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onFileSelect: (filePath: string) => void
  fileIcons: Record<string, string>
  onMetadataLoaded: (filePath: string, metadata: { icon?: string; banner?: string }) => void
  enabledPlugins: Record<string, boolean>
  onTogglePlugin?: (pluginId: string) => void
  onOpenWorkspace: () => void
}

function SidebarBody({
  activeView,
  workspacePath,
  activeFilePath,
  showSearchInput,
  searchQuery,
  onSearchChange,
  onFileSelect,
  fileIcons,
  onMetadataLoaded,
  enabledPlugins,
  onTogglePlugin,
  onOpenWorkspace
}: SidebarBodyProps): React.JSX.Element {
  if (activeView === 'plugins') {
    return (
      <div className="flex-1 overflow-hidden h-full">
        <PluginsWidget
          enabledPlugins={enabledPlugins}
          onTogglePlugin={onTogglePlugin || ((): void => {})}
        />
      </div>
    )
  }

  if (workspacePath) {
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
        {/* Collapsible/Expandable Search Input */}
        {(showSearchInput || searchQuery) && (
          <SidebarSearch searchQuery={searchQuery} onSearchChange={onSearchChange} />
        )}

        {/* Tree Navigation */}
        <div className="sidebar-tree-wrapper flex-1 overflow-y-auto min-h-0">
          <FileTree
            rootPath={workspacePath}
            activeFilePath={activeFilePath}
            onFileSelect={onFileSelect}
            searchQuery={searchQuery}
            fileIcons={fileIcons}
            onMetadataLoaded={onMetadataLoaded}
          />
        </div>
      </div>
    )
  }

  return <SidebarEmptyState onOpenWorkspace={onOpenWorkspace} />
}

export default React.memo(SidebarBody)

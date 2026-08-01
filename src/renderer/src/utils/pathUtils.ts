export const normalizePath = (p: string): string => {
  if (!p) return p
  let normalized = p.replace(/\\/g, '/')
  if (normalized.match(/^[A-Za-z]:/)) {
    normalized = normalized.charAt(0).toLowerCase() + normalized.slice(1)
  }
  return normalized
}

export const getPathKey = (p: string): string => {
  return normalizePath(p).toLowerCase()
}

export const getRelativePath = (absPath: string, rootPath: string | null): string => {
  const normalizedAbs = normalizePath(absPath)
  if (!rootPath) return normalizedAbs
  const normalizedRoot = normalizePath(rootPath)
  return normalizedAbs.toLowerCase().startsWith(normalizedRoot.toLowerCase())
    ? normalizedAbs.slice(normalizedRoot.length).replace(/^[\\/]/, '')
    : normalizedAbs
}

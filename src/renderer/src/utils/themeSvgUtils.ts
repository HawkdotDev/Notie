/**
 * Manipulate SVG string to inject theme color fill & stroke dynamically
 */
export function manipulateSvgTheme(svgString: string, themeColor: string = 'currentColor'): string {
  if (!svgString || !svgString.includes('<svg')) return svgString
  return svgString
    .replace(/fill="[^"]*"/g, `fill="${themeColor}"`)
    .replace(/stroke="[^"]*"/g, `stroke="${themeColor}"`)
    .replace(/<svg/, `<svg class="theme-svg"`)
}

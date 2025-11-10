/**
 * HitLine renders the vertical bar on the left side of the track. In the final
 * game the user will try to play notes when they reach this line.
 */
interface HitLineProps {
  isActive?: boolean
}

export function HitLine({ isActive = false }: HitLineProps) {
  const className = isActive ? 'hit-line hit-line--active' : 'hit-line'
  return <div className={className} aria-hidden data-active={isActive ? 'true' : 'false'} />
}

import { GROUP_URL } from "../config/credits";

/**
 * Text logo of the Urban Physics Research Group (the group has no logo):
 * bold capitals on Tampere University violet, linking to the group's page.
 */
export function UrbanPhysicsMark({ compact = false }: { compact?: boolean }) {
  return (
    <a
      className={compact ? "up-mark compact" : "up-mark"}
      href={GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Urban Physics Research Group, Tampere University (opens in a new tab)"
    >
      <span className="up-mark-name">URBAN PHYSICS</span>
      <span className="up-mark-sub">RESEARCH GROUP</span>
      <span className="up-mark-uni">
        Tampere University
        <ExternalIcon />
      </span>
    </a>
  );
}

export function ExternalIcon() {
  return (
    <svg className="external-icon" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

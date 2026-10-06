import { GROUP_URL } from "../config/credits";

// White version of the group's logo, for dark backgrounds
const LOGO = `${import.meta.env.BASE_URL}images/dark/urban_physics_logo.webp`;

/**
 * The Urban Physics Research Group's logo on Tampere University violet,
 * linking to the group's page.
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
      <img className="up-mark-logo" src={LOGO} alt="" />
      <span className="up-mark-uni">
        {compact ? "Tampere University" : "Research group · Tampere University"}
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

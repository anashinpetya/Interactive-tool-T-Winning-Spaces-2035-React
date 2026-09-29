import { NavLink } from "react-router-dom";
import { NAVIGATION } from "../config/navigation";

export function Sidebar({ onNavigate, onClose }: { onNavigate: () => void; onClose: () => void }) {
  return (
    <nav className="sidebar" aria-label="Pages">
      <div className="brand">
        <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
        <div>
          <div className="brand-name">T-Winning Spaces 2035</div>
          <div className="brand-sub">Interactive tool</div>
        </div>
        <button type="button" className="icon-button sidebar-close" aria-label="Close menu" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {NAVIGATION.map((group) => (
        <div key={group.heading} className="nav-group">
          <div className="nav-heading">{group.heading}</div>
          {group.links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              onClick={onNavigate}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        Urban Physics Research Group
        <br />
        Tampere University
      </div>
    </nav>
  );
}

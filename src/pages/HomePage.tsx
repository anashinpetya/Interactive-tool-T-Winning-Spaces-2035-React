import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ExternalIcon, UrbanPhysicsMark } from "../components/UrbanPhysicsMark";
import { GROUP_URL, PROJECT_URL, RESEARCH_AUTHORS, TOOL_AUTHOR } from "../config/credits";
import { IMPACTS_PAGE } from "../config/impacts";
import { MAP_PAGES } from "../config/mapPages";
import { SCENARIOS } from "../config/scenarios";

// Light versions of the logos for the dark background (scripts/make_dark_logos.py)
const images = `${import.meta.env.BASE_URL}images/dark/`;

// Each card glows in its logo's brand colour
const LOGOS = [
  { file: "Tampere_uni_logo.png", alt: "Tampere University", href: "https://www.tuni.fi/en", glow: "#b07aff", glow2: "#8a3dff" },
  {
    file: "logo1.png",
    alt: "Funded by the European Union - NextGenerationEU",
    href: "https://next-generation-eu.europa.eu/",
    glow: "#3d7bff",
    glow2: "#ffcc00",
  },
  { file: "logo2.png", alt: "Research Council of Finland", href: "https://www.aka.fi/en/", glow: "#2fa8ff", glow2: "#1f6fff" },
];

const SCENARIO_TEXT: Record<string, string> = {
  S1: "Nobody works remotely.",
  S2: "Today's share of remote workers — the baseline that every result is compared with.",
  S3: "Everyone whose job allows it works remotely.",
};

export function HomePage() {
  return (
    <article className="page home">
      <header className="hero">
        <p className="eyebrow">T-Winning Spaces 2035 · Work Package 3</p>
        <h1>Remote work, emissions and health in the Helsinki capital region</h1>
        <p className="lede">
          Explore potential environmental and health impacts of different remote-working scenarios. Move the slider
          on any page to set the share of remote workers; the results between the three base scenarios are
          interpolated.
        </p>

        <div className="hero-brands">
          <a
            className="brand-card"
            href={PROJECT_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Project website t-winning-spaces2035.com (opens in a new tab)"
          >
            <img src={images + "T-winning_logo_green.png"} alt="" />
            <span className="brand-card-text">
              <span className="brand-card-kicker">Project website</span>
              <span className="brand-card-link">
                t-winning-spaces2035.com
                <ExternalIcon />
              </span>
            </span>
          </a>
          <UrbanPhysicsMark />
        </div>
      </header>

      <section className="about" aria-labelledby="about-heading">
        <div className="about-body">
          <h2 id="about-heading">About the project</h2>
          <p>
            The <strong>T-Winning Spaces 2035</strong> project aims to point towards winning spatial solutions for
            future work, enabling the double twin transition of digital/green and virtual/physical transforming our
            societies by 2035. Within this remit, this tool allows interactive visualization of the results from Work
            Package 3, whose goal was to understand the health impacts associated with digital work futures, and
            quantify the possible changes to GHG emissions. More information:{" "}
            <a href={PROJECT_URL} target="_blank" rel="noopener noreferrer">
              t-winning-spaces2035.com
            </a>
          </p>
          <p className="funding">
            T-Winning Spaces 2035 is a project funded by the Research Council of Finland and has received funding from
            the European Union NextGenerationEU programme.
          </p>
        </div>

        <dl className="credits">
          <div className="credit">
            <dt>Author of the online tool</dt>
            <dd>
              <span className="credit-names">{TOOL_AUTHOR}</span>
              <span className="credit-note">Designed and developed this interactive tool</span>
            </dd>
          </div>
          <div className="credit">
            <dt>Authors of the research</dt>
            <dd>
              <span className="credit-names">{RESEARCH_AUTHORS.join(", ")}</span>
              <span className="credit-note">
                <a href={GROUP_URL} target="_blank" rel="noopener noreferrer">
                  Urban Physics Research Group
                </a>
                , Tampere University
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="scenario-cards" aria-label="Scenarios">
        {SCENARIOS.map((s) => (
          <div key={s.id} className={`scenario-card ${s.id.toLowerCase()}`}>
            <div className="scenario-card-top">
              <span className="scenario-card-id">{s.id}</span>
              <span className="scenario-card-pct">{s.percent} %</span>
            </div>
            <div className="scenario-card-name">{s.name}</div>
            <p>{SCENARIO_TEXT[s.id]}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="explore-heading">
        <h2 id="explore-heading">What you can explore</h2>
        <div className="explore-grid">
          {[...MAP_PAGES, IMPACTS_PAGE].map((p) => (
            <Link key={p.path} to={p.path} className="explore-card">
              <span className="explore-card-group">{p.group}</span>
              <span className="explore-card-title">{p.navLabel}</span>
              <span className="explore-card-text">{p.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="partners-heading">
        <h2 id="partners-heading" className="section-eyebrow">
          Partners &amp; funding
        </h2>
        <div className="logo-row">
          {LOGOS.map((logo) => (
            <a
              key={logo.file}
              className="logo-card"
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ "--glow": logo.glow, "--glow-2": logo.glow2 } as CSSProperties}
            >
              <img src={images + logo.file} alt={logo.alt} />
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}

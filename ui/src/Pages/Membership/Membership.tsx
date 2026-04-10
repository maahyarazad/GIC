import React from "react";

import { usePage } from '../../providers/PageContext';
import {  useNavigate } from 'react-router-dom';
type Props = {
    siteData: any
}

const Membership: React.FC<Props> = ({ siteData }) => {

        const { showPage, activePage } = usePage();
    const navigate = useNavigate();

  return (
    <div id="page-membership" className={`page ${activePage === "/membership" ? "active" : ""}`}>
      <div className="ptnav"></div>

      <div className="mem-hero">
        <div className="mem-hi">
          <div>
            <div className="slbl">Membership</div>
            <h1 className="mem-title">
              You&apos;ll
              <br />
              <em>get chosen.</em>
            </h1>
          </div>

          <p className="mem-sub">
            ClubMembership is extended by <strong>invitation only</strong> —
            ensuring a cadre of like-minded individuals with proven regional
            aspirations, fostering an environment where insights into investment
            imbalances and high-stake opportunities are exchanged without
            intermediaries.
          </p>
        </div>
      </div>

      <div className="crit-sec">
        <div className="slbl">Who Qualifies</div>
        <h2 className="stit">
          Membership <em>Profiles</em>
        </h2>

        <div className="crit-grid">
          <div className="crit-card">
            <div className="crit-num">01</div>
            <div className="crit-title">C-Suite Executives</div>
            <p className="crit-body">
              C-Suite executives of German, Austrian, or Swiss industrial or
              distribution entities with active or planned MEA operations.
              Managing directors, board members, and division heads with
              investment authority.
            </p>
          </div>

          <div className="crit-card">
            <div className="crit-num">02</div>
            <div className="crit-title">DACH Family Business Principals</div>
            <p className="crit-body">
              Industrial family business principals from the DACH region focused
              on MEA markets — with the strategic depth and long-term
              orientation that defines the Club&apos;s culture.
            </p>
          </div>

          <div className="crit-card">
            <div className="crit-num">03</div>
            <div className="crit-title">Professional Investors</div>
            <p className="crit-body">
              German, Austrian or Swiss professional investors focused on MEA
              markets, infrastructure, and industrial growth. Corporate
              investors with a direct and substantive MEA mandate.
            </p>
          </div>

          <div className="crit-card">
            <div className="crit-num">04</div>
            <div className="crit-title">Brand Owners &amp; Corporates</div>
            <p className="crit-body">
              Visionary DACH-corporates exporting own products and services,
              looking to correct market share deficits through localised
              investment. DACH brand owners with genuine regional ambition.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--bg)",
          padding: "72px 80px",
          borderTop: "1px solid var(--bdr)",
          borderBottom: "1px solid var(--bdr)",
        }}
      >
        <div className="rp-inner">
          <div>
            <div className="slbl">The Connection</div>
            <h3
              style={{
                fontFamily: "var(--se)",
                fontSize: "clamp(28px,3.2vw,44px)",
                fontWeight: 300,
                lineHeight: 1.1,
                color: "var(--txt)",
                marginBottom: "20px",
              }}
            >
              DACH expertise
              <br />
              meets{" "}
              <em
                style={{
                  fontStyle: "italic",
                  color: "var(--ora)",
                }}
              >
                MEA opportunity.
              </em>
            </h3>

            <p
              style={{
                fontFamily: "var(--sa)",
                fontSize: "15px",
                fontWeight: 300,
                lineHeight: 1.8,
                color: "var(--mu)",
              }}
            >
              The Club operates as the precise bridge between German industrial
              capability and MEA market access — connecting members selectively
              with the right counterparts, at the right time, for the right
              reason.
            </p>
          </div>

          <div className="rp-div">
            <p
              style={{
                fontFamily: "var(--sa)",
                fontSize: "15px",
                fontWeight: 300,
                lineHeight: 1.8,
                color: "var(--mu)",
                marginBottom: "20px",
              }}
            >
              Never randomly. Never publicly. Always prepared, contextualised,
              and at peer level.
            </p>

            <p
              style={{
                fontFamily: "var(--sa)",
                fontSize: "15px",
                fontWeight: 300,
                lineHeight: 1.8,
                color: "var(--mu)",
              }}
            >
              We connect ClubMembers selectively with ministries, state
              investment authorities, economic development agencies, regulatory
              bodies, and strategic local partners across 15+ MEA markets.
            </p>
          </div>
        </div>
      </div>

      <div className="prin-sec">
        <div className="slbl">Membership Principles</div>
        <h2 className="stit">
          Trust &amp; Integrity <em>at its Core</em>
        </h2>

        <div className="prin-grid">
          <div className="prin-card">
            <div className="prin-icon">Invitation-Only</div>
            <p className="prin-text">
              Guarantee of a homogeneous peer group at the highest
              decision-making level. No open access. No exceptions.
            </p>
          </div>

          <div className="prin-card">
            <div className="prin-icon">C-Suite &amp; Investors Exclusively</div>
            <p className="prin-text">
              Limited to board members, managing directors, entrepreneurs,
              division heads with investment authority, and professional MEA
              investors.
            </p>
          </div>

          <div className="prin-card">
            <div className="prin-icon">Trusted Environment</div>
            <p className="prin-text">
              Discretion and compliance are fundamental prerequisites. What is
              discussed within the Club stays within the Club.
            </p>
          </div>

          <div className="prin-card">
            <div className="prin-icon">Bridge-Builder Function</div>
            <p className="prin-text">
              Facilitate relevant, bilateral connections amongst ClubMembers and
              governmental decision-makers in the region.
            </p>
          </div>

          <div className="prin-card">
            <div className="prin-icon">Selection Criteria</div>
            <p className="prin-text">
              Members invited on corporate reputation, depth of MEA engagement,
              strategic aspirations, and alignment with our ethos of
              intellectual collaboration.
            </p>
          </div>

          <div className="prin-card">
            <div className="prin-icon">
              Relevance. Experience. Seriousness.
            </div>
            <p className="prin-text">
              We assess strategic seriousness — not size, not visibility. Those
              seeking mere connectivity are excluded by design.
            </p>
          </div>
        </div>
      </div>

      <div className="persp-sec">
        <div className="persp-in">
          <div
            className="slbl"
            style={{
              justifyContent: "center",
              marginBottom: "22px",
            }}
          >
            Our Perspective
          </div>

          <div className="persp-title">We believe in:</div>

          <div className="belief-list">
            <div className="belief-row">
              <div className="belief-dash">&mdash;</div>
              <div className="belief-tx">
                Long-term market presence over short-term arbitrage
              </div>
            </div>

            <div className="belief-row">
              <div className="belief-dash">&mdash;</div>
              <div className="belief-tx">
                Industrial depth over symbolic entry
              </div>
            </div>

            <div className="belief-row">
              <div className="belief-dash">&mdash;</div>
              <div className="belief-tx">
                Local value creation over nominal representation
              </div>
            </div>

            <div className="belief-row">
              <div className="belief-dash">&mdash;</div>
              <div className="belief-tx">
                Respect for governmental structures
              </div>
            </div>

            <div className="belief-row">
              <div className="belief-dash">&mdash;</div>
              <div className="belief-tx">
                Capital deployed with responsibility
              </div>
            </div>
          </div>

          <p
            style={{
              fontFamily: "var(--se)",
              fontSize: "17px",
              fontStyle: "italic",
              color: "var(--mu)",
              marginTop: "32px",
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            The MEA region rewards patience, structure, and understanding — not
            speed.
          </p>

          <div
            style={{
              textAlign: "center",
              marginTop: "32px",
            }}
          >
            <a className="btn-p" onClick={() => {showPage("contact");   navigate("/contact");}}>
              Introduce Yourself
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Membership;
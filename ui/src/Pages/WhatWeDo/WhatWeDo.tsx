import React from "react";

import { usePage } from '../../Providers/PageContext';
import {  useNavigate } from 'react-router-dom';


type Props = {
    siteData: any
}

const WhatWeDo: React.FC<Props> = ({ siteData }) => {
    const { showPage, activePage } = usePage();

const navigate = useNavigate();


    const handleNavigate = (path: string) => {
        if (typeof window === 'undefined') return;
        showPage(path);
        navigate(path);
    };

    return (

  <div id="page-wwd" className={`page ${activePage === "/what-we-do" ? "active" : ""}`}>
  <div className="ptnav"></div>

  <div className="wwd-hero">
    <div className="wwd-hi">
      <div className="slbl">Strategic Value</div>
      <h1 className="wwd-title">
        We facilitate
        <br />
        <em>transition.</em>
      </h1>
      <p className="wwd-sub">
        A decision-level platform for know-how, substance, access and execution.
        Our members share one strategic objective: to build, expand, and secure
        long-term industrial presence across MEA.
      </p>
    </div>
  </div>

  <div className="wwd-how">
    <div className="slbl">How We Work</div>
    <h2 className="stit">
      Discreet. Precise. <em>Substantive.</em>
    </h2>

    <div className="wwd-hg">
      <div className="wwd-hint">
        Creating structure before action. On the basis of research, analytics,
        and member-to-member intelligence, the Club facilitates the transition
        from fresh market to market presence — from participation to leadership.
      </div>

      <div className="wwd-ml">
        <div className="wwd-mi">
          <div className="wwd-mn">01</div>
          <div className="wwd-mt">
            Curated, small-format sessions
            <span>
              Intimate roundtables and briefings designed for depth, not
              breadth.
            </span>
          </div>
        </div>

        <div className="wwd-mi">
          <div className="wwd-mn">02</div>
          <div className="wwd-mt">
            Confidential briefings
            <span>
              Market-specific intelligence shared in a protected environment.
            </span>
          </div>
        </div>

        <div className="wwd-mi">
          <div className="wwd-mn">03</div>
          <div className="wwd-mt">
            Market-specific deep dives
            <span>
              Jurisdiction-level analysis of underrepresentation, demand gaps,
              and tender pipelines.
            </span>
          </div>
        </div>

        <div className="wwd-mi">
          <div className="wwd-mn">04</div>
          <div className="wwd-mt">
            Direct exchange with decision-makers
            <span>
              Curated introductions to ministries, state investment authorities,
              and agencies.
            </span>
          </div>
        </div>

        <div className="wwd-mi">
          <div className="wwd-mn">05</div>
          <div className="wwd-mt">
            No pitches. No panels. No publicity.
            <span>
              A reserved environment concentrating on substantive topics beyond
              public knowledge.
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div className="wwd-pillars">
    <div className="slbl">Core Pillars</div>
    <h2 className="stit">
      Four Dimensions of <em>Engagement</em>
    </h2>

    <div className="wwd-pg">
      <div className="wwd-pi">
        <div className="wwd-pl">Pillar 01</div>
        <div className="wwd-pt">Market Arbitrage &amp; Intelligence</div>
        <p className="wwd-pb">
          Identifying systemic underrepresentation and investment imbalances.
          Where does demand exist without adequate supply? Where is growth
          limited by structure rather than market size? We translate these into
          decision-ready frameworks.
        </p>
      </div>

      <div className="wwd-pi">
        <div className="wwd-pl">Pillar 02</div>
        <div className="wwd-pt">Infrastructure &amp; Localisation</div>
        <p className="wwd-pb">
          Advisory on establishing regional distribution hubs, local packaging,
          and production lines. Scaling market presence — distribution centres
          as regional hubs, local-for-local strategies, and capital allocation
          for market share.
        </p>
      </div>

      <div className="wwd-pi">
        <div className="wwd-pl">Pillar 03</div>
        <div className="wwd-pt">High-Stake Procurement</div>
        <p className="wwd-pb">
          Early intelligence and structured preparation for capital-intensive
          government or parastatal tenders. A clear line of sight into
          large-scale sovereign development projects often obscured in public
          discourse.
        </p>
      </div>

      <div className="wwd-pi">
        <div className="wwd-pl">Pillar 04</div>
        <div className="wwd-pt">G2B Bridgebuilding</div>
        <p className="wwd-pb">
          Navigating the regulatory landscape through direct conduits to
          ministries and government officials. Exclusive dialogue formats with
          relevant regulatory authorities. Always prepared, contextualised, and
          at peer level.
        </p>
      </div>
    </div>
  </div>

  <div
    style={{
      background: "var(--bgp)",
      padding: "72px 80px",
      borderTop: "1px solid var(--bdr)",
    }}
  >
    <div className="rp-inner">
      <div>
        <div className="slbl">15+ MEA Markets</div>
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
          A region of
          <br />
          <em
            style={{
              fontStyle: "italic",
              color: "var(--ora)",
            }}
          >
            structural opportunity.
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
          From sovereign wealth capitals in the Gulf to logistics hubs in East
          Africa and manufacturing corridors in North Africa — each market has
          distinct dynamics, its own regulatory framework, and its own entry
          logic.
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
          The Club maps these connections so its members don’t have to navigate
          blindly. We translate complexity into structured access — identifying
          where German industrial expertise creates the highest strategic value.
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
          Our research covers underrepresented sectors, supply-demand
          imbalances, tender pipelines, and the governmental relationships that
          open doors others cannot reach.
        </p>
      </div>
    </div>
  </div>

  <div className="wwd-trans">
    <div className="wwd-ti">
      <div
        className="slbl"
        style={{
          justifyContent: "center",
        }}
      >
        The MEA Region
      </div>

      <p className="wwd-tq">
        The MEA region is not a single market. It is a composition of
        underrepresented sectors, diverse logistical hubs, structural supply
        gaps, <em>scale challenges &amp; opportunities</em>, and state-driven
        investment programmes.
      </p>

      <div className="wwd-td"></div>

      <p className="wwd-ts">
        We connect ClubMembers selectively with ministries, state investment
        authorities, economic development agencies, regulatory bodies, and
        strategic local partners — never randomly, never publicly. Always
        prepared, contextualised, and at peer level.
      </p>
    </div>
  </div>

  <div className="focus-sec">
    <div className="slbl">Our Focus</div>
    <h2 className="stit">
      The Economic <em>Questions</em>
    </h2>

    <div className="focus-cols">
      <div>
        <p className="focus-intro">
          The Club addresses each member's regional interest along clear
          economic questions — translating them into decision-ready frameworks:
          market entry, scaling strategies, partnerships, and investments.
        </p>

        <br />
        <br />

        <a className="btn-p" onClick={() => {handleNavigate('/contact')}}>
          Discuss Your MEA Strategy
        </a>
      </div>

      <div className="focus-qs">
        <div className="focus-q">
          Where does demand exist without adequate supply?
        </div>
        <div className="focus-q">
          Where is growth limited by structure rather than market size?
        </div>
        <div className="focus-q">
          Where does local footprint outperform export models?
        </div>
        <div className="focus-q">
          Where do government programmes open real industrial entry points?
        </div>
        <div className="focus-q">
          Where do investments in own facilities or joint ventures make sense?
        </div>
        <div className="focus-q">
          Who are the right partners in each specific country?
        </div>
      </div>
    </div>
  </div>


</div>

    );
};

export default WhatWeDo;
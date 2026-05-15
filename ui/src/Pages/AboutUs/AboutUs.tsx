import React, {useEffect} from "react";
import { usePage } from '@/Providers/PageContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface Props {
    siteData: any;
}

const AboutUs: React.FC<Props> = ({ siteData }) => {
    const { showPage, activePage } = usePage();
    const navigate = useNavigate();


    return (
        <div id="page-about" className={`page ${activePage === "/about-us" ? "active" : ""}`}>
            <div className="ptnav"></div>

            <div className="ap-hero">
                <div className="ap-inner">
                    <div>
                        <div className="slbl">About the Club</div>
                        <h1 className="ap-title">
                            Fostering a<br />
                            <em>smart market<br />approach.</em>
                        </h1>
                    </div>
                    <p className="ap-intro">
                        We exist to bridge German industrial capabilities with MEA governmental and ministerial frameworks, enabling members to navigate underrepresented markets and capitalise on structural inefficiencies.{" "}
                        <strong>Value is created before decisions are taken</strong> &mdash; always guided by economic rationale, not opportunism.
                    </p>
                </div>
            </div>

            <div className="mfst">
                <div className="mfst-in">
                    <p className="mfst-q">
                        "We are not a networking platform. We curate bridges to <em>key decision-makers</em> in ministries and government bodies of MEA countries &mdash; an operational catalyst for those moving beyond export toward local value creation."
                    </p>
                    <div className="mfst-div"></div>
                    <p className="mfst-sub">
                        Positioned upstream from the standard, the Club is a discreet forum for established players with strategic MEA interests &mdash; providing clarity, strategic foresight, and access amongst leaders grappling with complex transformations.
                    </p>
                </div>
            </div>

            <div className="rp-grid">
                <div className="rp-cell">
                    <div className="slbl">Origin</div>
                    <h3
                        style={{
                            fontFamily: "var(--se)",
                            fontSize: "clamp(28px,3.2vw,44px)",
                            fontWeight: 300,
                            lineHeight: 1.1,
                            color: "var(--txt)"
                        }}
                    >
                        Germany, Austria<br />&amp; <em style={{ fontStyle: "italic", color: "var(--ora)" }}>Switzerland</em>
                    </h3>
                    <p
                        style={{
                            fontFamily: "var(--sa)",
                            fontSize: "15px",
                            fontWeight: 300,
                            lineHeight: 1.8,
                            color: "var(--mu)"
                        }}
                    >
                        The Club draws its members exclusively from the DACH industrial heartland &mdash; companies with decades of engineering depth, export excellence, and the strategic ambition to build beyond their home markets.
                    </p>
                </div>

                <div className="rp-cell rp-cell-alt">
                    <div className="slbl">Destination</div>
                    <h3
                        style={{
                            fontFamily: "var(--se)",
                            fontSize: "clamp(28px,3.2vw,44px)",
                            fontWeight: 300,
                            lineHeight: 1.1,
                            color: "var(--txt)"
                        }}
                    >
                        Middle East<br />&amp; <em style={{ fontStyle: "italic", color: "var(--ora)" }}>Africa</em>
                    </h3>
                    <p
                        style={{
                            fontFamily: "var(--sa)",
                            fontSize: "15px",
                            fontWeight: 300,
                            lineHeight: 1.8,
                            color: "var(--mu)"
                        }}
                    >
                        From Dubai and Riyadh to Nairobi and Lagos &mdash; the MEA region represents the world's most dynamic frontier for German industrial expansion. Underrepresented, structurally rich, and open to those who engage at the right level.
                    </p>
                </div>
            </div>

            <div className="env-sec">
                <div className="slbl">The Environment</div>
                <h2 className="stit">
                    <em>Exclusivity</em> as a Standard
                </h2>
                <div className="env-cols">
                    <div>
                        <p className="env-body">
                            The Club operates on a <strong>By-Invitation-Only</strong> basis &mdash; a trusted environment designed specifically for C-Suite executives, entrepreneurs, and professional investors. Members are unified by a shared &ldquo;Regional Aspiration&rdquo;: the drive to solidify presence through capital expenditure and local integration.
                        </p>
                        <br />
                        <p className="env-body">
                            We assess <strong>relevance, experience, and strategic seriousness.</strong> Not size. Not visibility.
                        </p>
                        <br />

                           <span  style={{ marginTop: "8px", display: "inline-flex" }} onClick={() => {
                            showPage('/membership');
                            navigate('/membership');
                        }} className="btn-p">  Membership Criteria &rarr;</span>

                      
                    </div>

                    <div className="env-facts">
                        <div className="env-fact">
                            <div className="env-dot"></div>
                            <div className="env-ft">
                                <strong>Discreet. Precise. Substantive.</strong> Curated, small-format sessions with direct exchange with decision-makers. No pitches. No panels. No publicity.
                            </div>
                        </div>
                        <div className="env-fact">
                            <div className="env-dot"></div>
                            <div className="env-ft">
                                <strong>Confidential Briefings</strong> Market-specific deep dives with proprietary intelligence shared in a protected, peer-level environment.
                            </div>
                        </div>
                        <div className="env-fact">
                            <div className="env-dot"></div>
                            <div className="env-ft">
                                <strong>Why the Club Exists</strong> Many companies want MEA presence. Few truly understand how to invest and scale sustainably. The Club exists to close that gap.
                            </div>
                        </div>
                        <div className="env-fact">
                            <div className="env-dot"></div>
                            <div className="env-ft">
                                <strong>Research over Volume</strong> Our understated approach prioritises analytics and intellectual rigour over volume.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;

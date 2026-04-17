import React, { useContext } from 'react';
import { EnvContext } from '@/EnvContext';
import './Home.css';
import { usePage } from '@/Providers/PageContext';
import { useModal } from "@/Providers/ModalContext";
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from "../../store";
import { setReady } from '../../features/appSlice';

const Home = () => {
    const dispatch = useDispatch();
    
    const siteData = useSelector((state: RootState) => state.app.siteData);
    const isReady = useSelector((state: RootState) => state.app.isReady);


    const { showPage, activePage } = usePage();
    const env = useContext(EnvContext);
    console.log(env);
    const { openModal } = useModal();

    const openExpert = (expertName: string) => {
        const expert = siteData?.expertData?.[expertName];
        if (!expert) return;
        openModal({
            variant: "expert",
            expert: {
                init: expert.init,
                name: expert.name,
                role: expert.role,
                tag: expert.tag,
                bio: expert.bio,
                exp: expert.exp,
                bg: expert.bg,
            }
        });
    };

    const handleNavigate = (path: string) => {
        if (typeof window === 'undefined') return;
        showPage(path);
        window.location.href = path;
    };

    if (!isReady) return null;

    return (
        <>
             <div id="page-home" className={`page active`}>
                <div className='hero'>
                    {typeof window !== 'undefined' && (
                        <video autoPlay loop muted playsInline className='hero-vid'>
                            <source src={`${env?.VITE_SERVER_API_URL}/uploads/${siteData?.media?.home_background}`} type="video/mp4" />
                        </video>
                    )}

                    <div className="hero-overlay"></div>

                    <div className="hero-content">
                        <div className="hero-eyebrow">The Mandate</div>
                        <h1 className="hero-title">
                            German industrial<br />leaders conquer<br />markets in <em>MEA.</em>
                        </h1>
                        <p className="hero-sub">
                            Geostrategic Expansion, Measured Investment. Sovereign Connectivity.
                        </p>
                        <p className="hero-tag">
                            Bridgebuilding &middot; Research &amp; Analytics &middot; Governmental Access &middot; Market Intelligence
                        </p>
                        <div className="hero-actions">
                            <span onClick={() => handleNavigate('/contact')} className="btn-p">Introduce Yourself</span>
                            <span onClick={() => handleNavigate('/about-us')} className="btn-g">Our Mandate &rarr;</span>
                        </div>
                    </div>

                    <div className="hero-stats">
                        <div>
                            <div className="stat-n">15<span>+</span></div>
                            <div className="stat-l">MEA Markets</div>
                        </div>
                        <div className="stat-div"></div>
                        <div>
                            <div className="stat-n">DACH</div>
                            <div className="stat-l">Origin</div>
                        </div>
                        <div className="stat-div"></div>
                        <div>
                            <div className="stat-n">C<span>-Suite</span></div>
                            <div className="stat-l">Members Only</div>
                        </div>
                    </div>

                    <div className="hero-scroll">
                        <div className="scroll-line"></div><span style={{ fontSize: 11 }}>Scroll</span>
                    </div>
                </div>

                <div className="npb">
                    <div className="npi">Pitches</div><div className="npi">Panels</div><div className="npi">Publicity</div>
                    <div className="npi">Generic Networking</div><div className="npi">Mediocrity</div>
                </div>

                <div className="about-strip">
                    <div className="about-txt">
                        <div className="slbl">Who We Are</div>
                        <h2 className="stit">A Discrete <em>Bridge</em><br />to Industrial MEA</h2>
                        <p className="about-body">The GERMAN INDUSTRY CLUB is an <strong>exclusive boutique circle</strong> of German industry executives, entrepreneurs and professional investors dedicated to the Middle East and Africa. Founded on principles of strategic alignment and mutual discretion, we facilitate informed dialogues among leaders who recognise the region's untapped potential.</p>
                        <p className="about-body">We are <strong>not a networking platform.</strong> We curate bridges to key decision-makers in ministries and government bodies of MEA countries &mdash; a strategic interface between established industrial expertise and local regulatory landscapes.</p>
                        <div className="about-tags">
                            <span className="atag">Bridgebuilding</span><span className="atag">Research &amp; Analytics</span>
                            <span className="atag">Governmental Access</span><span className="atag">Market Intelligence</span>
                            <span className="atag">Capital Allocation</span><span className="atag">By Invitation Only</span>
                        </div>
                    </div>
                    <div className="about-vis">
                        <svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" fill="none">
                            <circle cx="130" cy="130" r="110" stroke="rgba(200,84,26,0.12)" strokeWidth="1" />
                            <circle cx="130" cy="130" r="82" stroke="rgba(200,84,26,0.09)" strokeWidth="1" />
                            <circle cx="130" cy="130" r="54" stroke="rgba(200,84,26,0.07)" strokeWidth="1" />
                            <circle cx="130" cy="130" r="26" stroke="rgba(200,84,26,0.14)" strokeWidth="1" />
                            <ellipse cx="130" cy="130" rx="38" ry="110" stroke="rgba(200,84,26,0.07)" strokeWidth="1" />
                            <ellipse cx="130" cy="130" rx="75" ry="110" stroke="rgba(200,84,26,0.05)" strokeWidth="1" />
                            <ellipse cx="130" cy="130" rx="110" ry="38" stroke="rgba(200,84,26,0.05)" strokeWidth="1" />
                            <circle cx="130" cy="20" r="3" fill="rgba(200,84,26,0.6)" />
                            <circle cx="182" cy="66" r="2.5" fill="rgba(200,84,26,0.5)" />
                            <circle cx="200" cy="130" r="3" fill="rgba(200,84,26,0.7)" />
                            <circle cx="175" cy="185" r="2" fill="rgba(200,84,26,0.4)" />
                            <circle cx="130" cy="208" r="2.5" fill="rgba(200,84,26,0.5)" />
                            <circle cx="82" cy="185" r="2" fill="rgba(200,84,26,0.4)" />
                            <circle cx="62" cy="130" r="3" fill="rgba(200,84,26,0.6)" />
                            <line x1="130" y1="20" x2="200" y2="130" stroke="rgba(200,84,26,0.10)" strokeWidth="1" />
                            <line x1="200" y1="130" x2="130" y2="208" stroke="rgba(200,84,26,0.10)" strokeWidth="1" />
                            <line x1="130" y1="208" x2="62" y2="130" stroke="rgba(200,84,26,0.10)" strokeWidth="1" />
                            <line x1="62" y1="130" x2="130" y2="20" stroke="rgba(200,84,26,0.10)" strokeWidth="1" />
                            <circle cx="130" cy="130" r="6" fill="rgba(200,84,26,0.35)" />
                            <circle cx="130" cy="130" r="3" fill="rgba(200,84,26,0.9)" />
                        </svg>
                    </div>
                </div>

                <hr className="divider" />

                <div className="sec" style={{ background: "var(--bgp)" }}>
                    <div className="slbl">What We Do</div>
                    <h2 className="stit">Four Core <em>Pillars</em></h2>
                    <div className="pillars-grid">
                        <div className="pillar">
                            <div className="pillar-num">01</div>
                            <div className="pillar-title">Market Arbitrage &amp; Intelligence</div>
                            <p className="pillar-body">Identifying systemic underrepresentation and investment imbalances within specific jurisdictions &mdash; where demand exists without adequate supply and where growth is limited by structure, not market size.</p>
                        </div>
                        <div className="pillar">
                            <div className="pillar-num">02</div>
                            <div className="pillar-title">Infrastructure &amp; Localisation</div>
                            <p className="pillar-body">Strategic advisory on establishing regional distribution hubs, local packaging facilities, and full-scale production lines. From exporter to local market participant.</p>
                        </div>
                        <div className="pillar">
                            <div className="pillar-num">03</div>
                            <div className="pillar-title">High-Stake Procurement</div>
                            <p className="pillar-body">Providing a clear line of sight into large-scale tenders and sovereign development projects &mdash; early intelligence and structured preparation for capital-intensive government opportunities.</p>
                        </div>
                        <div className="pillar">
                            <div className="pillar-num">04</div>
                            <div className="pillar-title">G2B Bridgebuilding</div>
                            <p className="pillar-body">Navigating the regulatory landscape through direct conduits to ministries and government officials in the MEA region. Always prepared, contextualised, and at peer level.</p>
                        </div>
                    </div>
                </div>

                <div className="sec" style={{ background: "var(--bg)" }}>
                    <div className="slbl">The Circle</div>
                    <h2 className="stit">Associate <em>Experts</em></h2>
                    <p style={{ fontFamily: "var(--se)", fontSize: "17px", fontStyle: "italic", color: "var(--mu)", marginTop: "12px", maxWidth: "520px", lineHeight: 1.7 }}>
                        Click any expert to view their full profile.
                    </p>
                    <div className="team-grid">
                        {[
                            { key: "jan", init: "JH", name: "Jan Hussing", role: "Geopolitics, Geoeconomics & Policy" },
                            { key: "reg", init: "RA", name: "Regional Advisor", role: "Sovereign Wealth & Investment" },
                            { key: "leg", init: "LA", name: "Legal Advisor", role: "MEA Regulatory & Compliance" },
                            { key: "eco", init: "EA", name: "Economic Analyst", role: "Market Intelligence & Research" },
                        ].map(({ key, init, name, role }) => (
                            <div className="team-card" key={key} onClick={() => openExpert(key)}>
                                <div className="team-img"><div className="team-init">{init}</div></div>
                                <div className="team-info">
                                    <div className="team-name">{name}</div>
                                    <div className="team-role">{role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Home;
import { useContext } from 'react';
import { EnvContext } from '../../EnvContext';
import './Home.css';
import { usePage } from '../../providers/PageContext';
import { Link } from 'react-router-dom';
const Home = ({ siteData }) => {
    const { activePage } = usePage();
    const env = useContext(EnvContext);


    if (!siteData) return null;




    return (
        <>
            <div id="page-home" className={`page ${activePage === "/" ? "active" : ""}`}>
                <div className='hero'>

                    <video autoPlay loop muted playsInline className='hero-vid'>
                        <source src={`${env.VITE_SERVER_API_URL}/uploads/${siteData.media.home_background}`} type="video/mp4" fetchPriority='high' />
                        Your browser does not support the video tag.
                    </video>



                    {/* <FloatingSocialMedia
                        size={18}
                        icons={siteData.footer.socialLinks}
                        disable={siteData.footer.disableSocialLinks}
                    /> */}

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
                            <Link className="btn-p" onClick={() => showPage("contact-us")}>
                                Apply for Membership
                            </Link>
                            <Link className="btn-g" to='about-us'>
                                Our Mandate &rarr;
                            </Link>
                        </div>
                    </div>

                    <div className="hero-stats">
                        <div>
                            <div className="stat-n">
                                15<span>+</span>
                            </div>
                            <div className="stat-l">MEA Markets</div>
                        </div>
                        <div className="stat-div"></div>
                        <div>
                            <div className="stat-n">DACH</div>
                            <div className="stat-l">Origin</div>
                        </div>
                        <div className="stat-div"></div>
                        <div>
                            <div className="stat-n">
                                C<span>-Suite</span>
                            </div>
                            <div className="stat-l">Members Only</div>
                        </div>
                    </div>

                    <div className="hero-scroll">
                        <div className="scroll-line"></div>Scroll
                    </div>




                </div>


            </div>
        </>
    );
};

export default Home;

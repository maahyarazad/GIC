import React from "react";
import "./AboutUs.css";

// interface ParagraphsSection {
//   title: string;
//   paragraphs: string[];
// }

// interface ItemsSection {
//   title: string;
//   items: { title: string; description: string }[];
// }

// interface TextSection {
//   title: string;
//   text: string;
// }

// interface ValuesSection {
//   title: string;
//   items: { title: string; description: string }[];
// }

// interface AboutUsData {
//   hero: {
//     title: string;
//     subHeading: string;
//   };
//   whoWeAre: ParagraphsSection;
//   whatWeDo: ItemsSection;
//   mission: TextSection;
//   vision: TextSection;
//   values: ValuesSection;
// }

  interface Props {
    siteData: any;
  }

const AboutUs: React.FC<Props> = ({ siteData }) => {
  
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <h1>{siteData.about_us.hero.title}</h1>
        <p className="sub-heading">{siteData.about_us.hero.subHeading}</p>
      </section>

      {/* Who We Are */}
      <section className="about-section">
        <h2>{siteData.about_us.whoWeAre.title}</h2>
        {siteData.about_us.whoWeAre.paragraphs.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </section>

      {/* What We Do */}
      <section className="about-section">
        <h2>{siteData.about_us.whatWeDo.title}</h2>
        <ul>
          {siteData.about_us.whatWeDo.items.map(({ title, description }, idx) => (
            <li key={idx}>
              <strong>{title}:</strong> {description}
            </li>
          ))}
        </ul>
      </section>

      {/* Mission */}
      <section className="about-section">
        <h2>{siteData.about_us.mission.title}</h2>
        <p>{siteData.about_us.mission.text}</p>
      </section>

      {/* Vision */}
      <section className="about-section">
        <h2>{siteData.about_us.vision.title}</h2>
        <p>{siteData.about_us.vision.text}</p>
      </section>

      {/* Values */}
      <section className="about-section">
        <h2>{siteData.about_us.values.title}</h2>
        <ul>
          {siteData.about_us.values.items.map(({ title, description }, idx) => (
            <li key={idx}>
              <strong>{title}</strong> — {description}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AboutUs;

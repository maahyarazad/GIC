import React from "react";
import "./AboutUs.css";

interface AboutSection {
  title: string;
  content?: string;
  list?: string[];
}

interface AboutUsData {
  sub_heading: string;
  who_we_are: AboutSection;
  what_we_do: AboutSection;
  mission: AboutSection;
  vision: AboutSection;
  values: AboutSection;
}

interface Props {
  about_us: AboutUsData;
}

const AboutUs: React.FC<Props> = ({ about_us }) => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <h1>About Us</h1>
        <p className="sub-heading">{about_us.sub_heading}</p>
      </section>

      {/* Who We Are */}
      <section className="about-section">
        <h2>{about_us.who_we_are.title}</h2>
        <p>{about_us.who_we_are.content}</p>
      </section>

      {/* What We Do */}
      <section className="about-section">
        <h2>{about_us.what_we_do.title}</h2>
        <ul>
          {about_us.what_we_do.list?.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Mission */}
      <section className="about-section">
        <h2>{about_us.mission.title}</h2>
        <p>{about_us.mission.content}</p>
      </section>

      {/* Vision */}
      <section className="about-section">
        <h2>{about_us.vision.title}</h2>
        <p>{about_us.vision.content}</p>
      </section>

      {/* Values */}
      <section className="about-section">
        <h2>{about_us.values.title}</h2>
        <ul>
          {about_us.values.list?.map((value, idx) => (
            <li key={idx}>{value}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AboutUs;

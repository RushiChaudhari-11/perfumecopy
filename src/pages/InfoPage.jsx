import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import footerPagesData from "../data/footerPagesData";
import SEO from "../components/SEO";
import "../styles/InfoPage.css";

const InfoPage = ({ group }) => {
  const { slug } = useParams();
  const page = footerPagesData[group]?.[slug];

  if (!page) return <Navigate to="/" replace />;

  const pageUrl = `http://www.perfumecopy.com/${group}/${slug}`;
  const metaDesc = page.hero || page.tagline || `${page.title} - Perfume Copy luxury fragrance documentation and policies.`;

  return (
    <main className="infopage">
      <SEO
        title={`${page.title} | Perfume Copy`}
        description={metaDesc}
        url={pageUrl}
      />
      <div className="infopage-glow" />

      <div className="infopage-hero">
        <span className="infopage-eyebrow">{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p className="infopage-tagline">{page.tagline}</p>
        <p className="infopage-intro">{page.hero}</p>
      </div>

      <div className="infopage-body">
        {page.sections.map((section, i) => (
          <section className="infopage-section" key={i}>
            <h2>{section.heading}</h2>

            {section.body && <p>{section.body}</p>}

            {section.list && (
              <ul className="infopage-list">
                {section.list.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="infopage-cta">
        <Link to="/" className="infopage-btn">
          {page.cta}
        </Link>
      </div>
    </main>
  );
};

export default InfoPage;

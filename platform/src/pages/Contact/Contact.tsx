import "./Contact.css";
import Footer from "../../components/layout/Footer/Footer";
import LandingNavbar from "../../components/layout/LandingNavbar/LandingNavbar";

export default function Contact() {
  return (
    <div className="contact-wrap">
      <LandingNavbar />
      <div className="contact-content">
        <h1>Get in touch</h1>
        <p className="subtitle">
          Found a bug? Have a feature idea? Just want to say hi? Contact us.
        </p>
        <div className="contact-cards">
          <a   className="contact-card github-btn"
            href="https://github.com/Runn077/PlopKit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z"/>
            </svg>
            <p className="card-title">Star us on GitHub</p>
            <p className="card-desc">Open source, self-hostable, contributions welcome.</p>
            <span className="card-action">View repo →</span>
          </a>
          <a href="mailto:plopkitcontact@gmail.com" className="contact-card">
            <p className="card-title">Email us directly</p>
            <p className="card-desc">For questions or anything else.</p>
            <span className="card-action">plopkitcontact@gmail.com →</span>
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
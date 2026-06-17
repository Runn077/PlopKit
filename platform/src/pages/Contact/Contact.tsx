import "./Contact.css";
import Footer from "../../components/Footer";
import LandingNavbar from "../../components/LandingNavbar";

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
          <a
            href="https://tally.so/r/2ER11j"
            target="_blank"
            rel="noreferrer"
            className="contact-card"
          >
            <p className="card-title">Bug report or feedback</p>
            <p className="card-desc">
              Tell us what went wrong or what you'd like to see.
            </p>
            <span className="card-action">Open form →</span>
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
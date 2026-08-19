import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} PlopKit. All rights reserved.</p>
      <p className="footer-links">
        <a href="https://plopkit.com/contact">Contact</a>
        <a href="https://plopkit.com/privacy">Privacy Policy</a>
        <a href="https://plopkit.com/terms">Terms of Service</a>
      </p>
    </footer>
  )
}
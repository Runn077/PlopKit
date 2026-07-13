import ReactMarkdown from 'react-markdown'
import content from './PrivacyPolicy.md?raw'
import './Legal.css'
import LandingNavbar from '../../components/layout/LandingNavbar/LandingNavbar'
import Footer from '../../components/layout/Footer/Footer'

export default function PrivacyPolicy() {
  return (
    <>
    <LandingNavbar/>
    <div className="legal-page">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
    <Footer/>
    </>
  )
}
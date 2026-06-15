import ReactMarkdown from 'react-markdown'
import content from './PrivacyPolicy.md?raw'
import './PrivacyPolicy.css'
import LandingNavbar from '../../components/LandingNavbar'
import Footer from '../../components/Footer'

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
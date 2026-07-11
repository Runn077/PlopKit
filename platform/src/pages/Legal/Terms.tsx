import ReactMarkdown from 'react-markdown'
import content from './TermsAndServices.md?raw'
import './Legal.css'
import LandingNavbar from '../../components/LandingNavbar'
import Footer from '../../components/Footer'

export default function Terms() {
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
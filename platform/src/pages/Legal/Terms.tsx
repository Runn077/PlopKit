import ReactMarkdown from 'react-markdown'
import content from './TermsAndServices.md?raw'
import './Terms.css'

export default function Terms() {
  return (
    <div className="legal-page">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
import ReactMarkdown from 'react-markdown'
import content from './PrivacyPolicy.md?raw'
import './PrivacyPolicy.css'

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
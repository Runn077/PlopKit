import type { ThemeTokens } from '../../types'
import './WidgetMockup.css'

interface Props {
  tokens: ThemeTokens
}

function WidgetMockup({ tokens }: Props) {
  return (
    <div
      className="ct-mock-widget"
      style={{
        fontFamily: tokens.fontFamily || undefined,
        color: tokens.colorText || undefined,
        background: tokens.widgetBg || undefined,
      }}
    >
      <h3 className="ct-mock-heading">2 Comments</h3>

      <div
        className="ct-mock-input-area"
        style={{
          background: tokens.inputBg || undefined,
          border: `1px solid ${tokens.inputBorder || '#ccc'}`,
          borderRadius: tokens.radius || undefined,
        }}
      >
        <div className="ct-mock-name-input" style={{ color: tokens.inputTextColor || undefined }}>
          Name (optional)
        </div>
        <div className="ct-mock-textarea" style={{ color: tokens.inputTextColor || undefined }}>
          Add a comment...
        </div>
        <button
          className="ct-mock-post-btn"
          style={{
            background: tokens.btnPostBg || undefined,
            color: tokens.btnPostText || undefined,
          }}
        >
          Post
        </button>
      </div>

      <div
        className="ct-mock-card"
        style={{
          background: tokens.cardBg || undefined,
          color: tokens.cardTextColor || undefined,
          borderTop: `1px solid ${tokens.dividerColor || '#f0f0f0'}`,
          borderRadius: tokens.cardRadius || undefined,
        }}
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <span className="ct-mock-badge" style={{ background: tokens.badgeOwner || '#4ecdc4' }}>Owner</span>
          <span className="ct-mock-badge" style={{ background: tokens.badgePinned || '#999' }}>Pinned</span>
        </div>
        <strong style={{ fontFamily: tokens.fontFamily || undefined }}>Jane Doe</strong>
        <p
          className="ct-mock-body"
          style={{ fontFamily: tokens.fontFamilyBody || tokens.fontFamily || undefined }}
        >
          This is what a comment looks like with your current theme.
        </p>
        <button className="ct-mock-link-btn" style={{ color: tokens.colorDanger || '#ff4444' }}>
          Delete
        </button>

        <div
          className="ct-mock-reply"
          style={{
            background: tokens.replyBg || undefined,
            color: tokens.replyTextColor || undefined,
            borderRadius: tokens.replyRadius || undefined,
          }}
        >
          <div
            className="ct-mock-quoted"
            style={{ borderLeftColor: tokens.quoteAccent || '#ffe66d' }}
          >
            Quoted reply text
          </div>
          <strong style={{ fontFamily: tokens.fontFamily || undefined }}>John Smith</strong>
          <p style={{ fontFamily: tokens.fontFamilyBody || tokens.fontFamily || undefined }}>
            And this is a reply to that comment.
          </p>
        </div>
      </div>
    </div>
  )
}

export default WidgetMockup
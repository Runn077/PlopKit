import LandingNavbar from '../../components/LandingNavbar'
import Footer from '../../components/Footer'
import { useNavigate } from 'react-router-dom'
import './Setup.css'

import imgAddSite from '../../assets/setup/setup-add-site.png'
import imgAddWidget from '../../assets/setup/setup-add-widget.png'
import imgScriptTag from '../../assets/setup/setup-script-tag.png'
import imgSignup from '../../assets/setup/signup.png'

const steps = [
  {
    num: '01',
    title: 'Create an Account',
    desc: 'Sign up for free with your Google account. No credit card required.',
    img: imgSignup,
  },
  {
    num: '02',
    title: 'Add a Site',
    desc: 'From your dashboard, click "Add Site" and enter your domain (e.g. myblog.com). This tells PlopKit where your widget will live.',
    img: imgAddSite,
  },
  {
    num: '03',
    title: 'Add a Widget',
    desc: 'Inside your site, click "Add Widget", give it a name, and hit create. You\'ll get a unique widget key.',
    img: imgAddWidget,
  },
  {
    num: '04',
    title: 'Copy Your Script Tag',
    desc: 'From the widget page, copy your script tag. It looks like this:',
    code: `<script src="https://plopkit.com/widget.js"\n  data-widget-key="your-widget-key-here">\n</script>`,
    img: imgScriptTag,
  },
]

const frameworks = [
  {
    name: 'HTML',
    desc: 'Paste the script tag anywhere before </body>.',
    code: `<!DOCTYPE html>
<html>
  <body>
    <h1>My Blog Post</h1>

    <!-- PlopKit widget -->
    <script
      src="https://plopkit.com/widget.js"
      data-widget-key="your-widget-key-here">
    </script>
  </body>
</html>`,
  },
  {
    name: 'React',
    desc: 'Use a useEffect to inject the script tag on mount.',
    code: `import { useEffect, useRef } from 'react'

export default function Comments() {
  const ref = useRef(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://plopkit.com/widget.js'
    script.setAttribute('data-widget-key', 'your-widget-key-here')
    ref.current?.appendChild(script)
    return () => script.remove()
  }, [])

  return <div ref={ref} />
}`,
  },
  {
    name: 'Vue',
    desc: 'Inject the script tag in onMounted.',
    code: `<template>
  <div ref="container" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const container = ref(null)
let script

onMounted(() => {
  script = document.createElement('script')
  script.src = 'https://plopkit.com/widget.js'
  script.setAttribute('data-widget-key', 'your-widget-key-here')
  container.value?.appendChild(script)
})

onUnmounted(() => script?.remove())
</script>`,
  },
  {
    name: 'Svelte',
    desc: 'Inject the script tag in onMount.',
    code: `<script>
  import { onMount } from 'svelte'

  let container
  let script

  onMount(() => {
    script = document.createElement('script')
    script.src = 'https://plopkit.com/widget.js'
    script.setAttribute('data-widget-key', 'your-widget-key-here')
    container?.appendChild(script)

    return () => script?.remove()
  })
</script>

<div bind:this={container} />`,
  },
]

export default function SetupPage() {
  const navigate = useNavigate()

  return (
    <div className="setup-page">
      <LandingNavbar />

      <div className="setup-hero">
        <h1>Get started in minutes</h1>
        <p>Add a comment section to any website with a single script tag.</p>
      </div>

      <div className="setup-container">

        {/* STEPS */}
        <section className="setup-steps">
          {steps.map((step, i) => (
            <div key={i} className={`setup-step ${i % 2 === 1 ? 'setup-step--reverse' : ''}`}>
              <div className="setup-step-text">
                <span className="setup-step-num">{step.num}</span>
                <h2 className="setup-step-title">{step.title}</h2>
                <p className="setup-step-desc">{step.desc}</p>
                {step.code && (
                  <div className="setup-code-block">
                    <pre><code>{step.code}</code></pre>
                  </div>
                )}
              </div>
              <div className="setup-step-image">
                <img
                  src={step.img}
                  alt={step.title}
                  className="setup-screenshot"
                />
              </div>
            </div>
          ))}
        </section>

        {/* FRAMEWORKS */}
        <section className="setup-frameworks">
          <h2 className="setup-section-title">Add to your framework</h2>
          <p className="setup-section-sub">Replace <strong>your-widget-key-here</strong> with the key from your dashboard.</p>
          <div className="setup-framework-grid">
            {frameworks.map((fw, i) => (
              <div key={i} className="setup-framework-card">
                <div className="setup-framework-header">
                  <span className="setup-framework-name">{fw.name}</span>
                  <span className="setup-framework-desc">{fw.desc}</span>
                </div>
                <div className="setup-code-block">
                  <pre><code>{fw.code}</code></pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="setup-cta">
          <h2>Ready to add comments?</h2>
          <p>Free plan includes 5,000 widget loads per month.</p>
          <button className="primary-btn" onClick={() => navigate('/signup')}>
            Get Started Free
          </button>
        </section>

      </div>

      <Footer />
    </div>
  )
}
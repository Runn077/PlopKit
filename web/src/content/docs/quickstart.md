---
title: Quickstart
---

# Quickstart
Get a comment widget live on your site in a few minutes.

<br />

## 1. Create an account
Sign up at [app.plopkit.com/signup](https://app.plopkit.com/signup) for free,
no credit card required.

<br />

## 2. Add your site
From the dashboard, register the domain where your widget will live.

<br />

## 3. Add a widget
Name your widget and click open.

<br />

## 4. Copy the script tag
Paste the script tag into your HTML wherever you want comments to appear. If you want to post comments from that widget on localhost, you will have to check "Allow localhost" in the websites settings.

```
<script 
  src="https://plopkit.com/widget.js" data-widget-key="your-widget-key">
</script>
```

<br />

**Note:** The widget expands to fill the width of its parent container. Wrap it in a `<div>` 
with a defined width so it doesn't stretch edge-to-edge unexpectedly:

```
<div style="max-width: 700px">
  <script 
    src="https://plopkit.com/widget.js" data-widget-key="your-widget-key">
  </script>
</div>
```

<br />

## 5. Moderate
Manage comments, pin, filter words, and more from your dashboard.

<br />

## Extra
**Note:** If you want more than one comment section, you will have to add a brand new widget with a different widget key.
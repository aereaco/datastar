[![Version](https://img.shields.io/github/package-json/v/aereaco/nexus-ux?filename=library/package.json)](https://github.com/aereaco/nexus-ux/releases)
[![License](https://img.shields.io/github/license/aereaco/nexus-ux)](https://github.com/aereaco/nexus-ux/blob/main/LICENSE)
[![Stars](https://img.shields.io/github/stars/aereaco/nexus-ux?style=flat)](https://github.com/aereaco/nexus-ux/stargazers)

<p align="center"><img width="200" src="https://nexus.aerea.co/static/images/rocket.webp"></p>

# Nexus-UX

### The hypermedia framework.

Nexus-UX helps you build reactive web applications with the simplicity of server-side rendering and the power of a full-stack SPA framework.

Getting started is as easy as adding a single 29.1 KiB script tag to your HTML.

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/aereaco/nexus-ux@v0.0.1-alpha/bundles/nexus-ux.js"></script>
```

Then start adding frontend reactivity using declarative <code>data-*</code> attributes.

```html
<input data-bind-title />
<div data-text="$title.toUpperCase()"></div>
<button data-on-click="@post('/endpoint')">Save</button>
```

Visit the [Nexus-UX Website »](https://nexus.aerea.co/)

Watch the [Videos »](https://www.youtube.com/@nexus-ux)

Join the [Discord Server »](https://discord.com/channels/1296224603642925098/1296224603642925102)

## Getting Started

Read the [Getting Started Guide »](https://nexus.aerea.co/guide/getting_started)

## Contributing

Read the [Contribution Guidelines »](https://github.com/aereaco/nexus-ux/blob/develop/CONTRIBUTING.md)

## Custom Plugins

You can manually add your own plugins to the core:

```html
<script type="importmap">
{
    "imports": {
      "nexus-ux": "https://cdn.jsdelivr.net/gh/aereaco/nexus-ux@v0.0.1-alpha/bundles/nexus-ux.js"
    }
}
</script>
<script type="module">
    import { load } from 'nexus-ux'

    load(
        // Look ma’, I made a plugin!
    )
</script>
```

[![Star History Chart](https://api.star-history.com/svg?repos=aereaco/nexus-ux&type=Date)](https://www.star-history.com/#aereaco/nexus-ux&Date)
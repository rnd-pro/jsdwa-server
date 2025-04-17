# JSDWA Server

## The solution to serve JSDWA files as web assets

### What is JSDWA?

**JSDWA** (Java Script Distributed Web Assets) is a modern approach that leverages JavaScript and JavaScript Template Literals to create a powerful web asset serving system. It provides a PHP-like templating experience with enhanced capabilities and modern JavaScript features, supporting multiple web application architectures.

### Core Features

- **Web Asset Serving**: Serve JS string exports as any text-based web assets with appropriate MIME types (HTML, CSS, SVG, etc.)
- **On-the-fly**: Build and minification for all assets
- **Server-Side Rendering**: Built-in SSR support for native Custom Elements
- **Performance Optimized**: Fast in-memory cache for production usage
- **Isomorphic Code**: Full-stack DRY support with shared code between client and server
- **Modern Dependency Management And Sharing**: Automated importmap generation based on package.json and your endpoints structure
- **Platform Standards**: Modern web standards usage without legacy dependencies
- **Hybrid Web App Model Support**: Seamlessly combine SSR, SPA, micro-frontends, and on-demand dynamic components without complex configurations
- **Distributed Assets Model**: ESM over HTTPS support with direct URL access to application components
- **Extensibility**: Add custom middleware to support your specific use cases

### Installation

```bash
npm install https://github.com/rnd-pro/jsdwa-server.git
```

### Quick Start

1. Create a configuration file (`project.cfg.js`):
```javascript
export default {
  routes: './ref/routes.js',
  pageDataFn: './ref/data.js',
  ssrComponents: {
    templates: './ref/wc/{name}/tpl.html.js',
    scripts: './ref/wc/{name}/index.js',
    styles: './ref/wc/{name}/style.css',
  },
  cache: true,
  port: 3000,
  importmap: true,
}
```

2. Start the server:
```bash
node ./node_modules/jsdwa-server/src/index.js
```

### Configuration Options

- `routes`: Path to your routes configuration file
- `pageDataFn`: Path to your page data middleware function
- `ssrComponents`: Configuration for server-side rendered components
  - `templates`: Template path schema
  - `scripts`: Component scripts path schema
  - `styles`: Component styles path schema
- `cache`: Enable/disable in-memory caching
- `port`: Server port number
- `importmap`: Enable/disable automatic importmap generation

### Usage Examples

#### Creating a Web Component

```javascript
// ref/wc/my-component/tpl.html.js
export default `
  <div class="my-component">
    <h1>{[title]}</h1>
    <p>{[content]}</p>
  </div>
`;

// ref/wc/my-component/index.js
export default `
  class MyComponent extends HTMLElement {
    connectedCallback() {
      this.innerHTML = \`<my-component>\`;
    }
  }
  customElements.define('my-component', MyComponent);
`;
```

#### Defining Routes

```javascript
// ref/routes.js
export default {
  '/': './pages/home/index.html.js',
  '/about/': './pages/about/index.html.js',
  '/contact/': './pages/contact/index.html.js'
};
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### License

MIT

### Authors

rnd-pro.com (team@rnd-pro.com)
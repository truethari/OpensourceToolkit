# 🧰 OpenSource Toolkit

A modern, comprehensive collection of developer and utility tools built with Next.js 15, React 19, and TypeScript. Designed for developers, security professionals, and anyone who needs reliable, fast, and secure utility tools.

![OpenSource Toolkit](./public/seo/1.png)

## 📸 Screenshot

![Speaker Testing Tool](./public/screenshots/2025-07-19.png)

## 🚀 Tech Stack

### Core Technologies

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest React with modern features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

### UI & Components

- **[Radix UI](https://www.radix-ui.com/)** - Headless, accessible components
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, reusable components
- **[Lucide React](https://lucide.dev/)** - Beautiful & consistent icons

### State & Data Management

- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[TanStack Query](https://tanstack.com/query)** - Powerful data synchronization
- **[Axios](https://axios-http.com/)** - HTTP client

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[Turbopack](https://turbo.build/pack)** - Ultra-fast bundler

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/truethari/OpensourceToolkit.git
   cd opensourcetoolkit
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   ```
   http://localhost:5001
   ```

### Build for Production

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
opensourcetoolkit/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (tools)/           # Grouped tool routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── tools/             # Tool-specific components
│   │   ├── general/           # Navigation & layout
│   │   └── wrappers/          # Layout wrappers
│   ├── config/                # Tool configuration
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── providers/             # React providers
│   ├── types/                 # TypeScript definitions
│   └── utils/                 # Utility functions
├── public/                    # Static assets
│   ├── seo/                   # SEO images
│   ├── sitemap.xml           # Auto-generated sitemap
│   └── robots.txt            # Search engine directives
├── components.json           # shadcn/ui config
├── tailwind.config.ts        # Tailwind configuration
└── next.config.ts           # Next.js configuration
```

## 🎯 Available Tools

### **Text & Data Generators**

| Tool                         | Description                                      | Route                       | Features                                             |
| ---------------------------- | ------------------------------------------------ | --------------------------- | ---------------------------------------------------- |
| **UUID Generator**           | Generate universally unique identifiers          | `/uuid`                     | V4 (Random), V1 (Timestamp), batch generation        |
| **Lorem Ipsum Generator**    | Generate placeholder text                        | `/lorem-ipsum`              | Words/sentences/paragraphs, multiple languages       |
| **Mock Data Generator**      | Generate realistic fake user data using Faker.js | `/mock-data-generator`      | User profiles, addresses, emails, multiple locales   |
| **QR Code Generator**        | Generate QR codes for text, URLs, WiFi, and more | `/qr-generator`             | Customizable styling, multiple formats, PNG download |
| **Privacy Policy Generator** | Generate comprehensive privacy policies          | `/privacy-policy-generator` | GDPR & CCPA compliance, customizable data practices  |

### **Format Converters**

| Tool                       | Description                       | Route              | Features                                          |
| -------------------------- | --------------------------------- | ------------------ | ------------------------------------------------- |
| **Timestamp Converter**    | Convert between timestamp formats | `/timestamp`       | Live time, batch conversion, multiple formats     |
| **Image Format Converter** | Convert image formats             | `/image-converter` | PNG/JPEG/GIF/WebP, batch processing, optimization |
| **Text Case Converter**    | Transform text cases              | `/text-converter`  | Uppercase, lowercase, title case, sentence case   |
| **Base64 Encoder/Decoder** | Encode/decode Base64 format       | `/base64`          | Text/file encoding, URL safe, multiple charsets   |

### **Security Tools**

| Tool                    | Description                                  | Route             | Features                                      |
| ----------------------- | -------------------------------------------- | ----------------- | --------------------------------------------- |
| **JWT Decoder/Encoder** | JWT encoding, decoding & verification        | `/jwt`            | Multi-algorithm support, security validation  |
| **HMAC Generator**      | Generate and verify HMAC codes               | `/hmac-generator` | Multiple algorithms, secure authentication    |
| **Hash Generator**      | Generate MD5, SHA-1, SHA-256, SHA-512 hashes | `/hash-generator` | Text & file support, security recommendations |

### **Network & Monitoring**

| Tool                    | Description                               | Route             | Features                                       |
| ----------------------- | ----------------------------------------- | ----------------- | ---------------------------------------------- |
| **IP Location Checker** | Check IP address geolocation              | `/ip-location`    | Geolocation, ISP info, timezone detection      |
| **Internet Speed Test** | Test internet connection speed            | `/speed-test`     | Download/upload speed, ping latency            |
| **DNS Lookup Tool**     | Query DNS records                         | `/dns-lookup`     | Multiple record types, batch lookup            |
| **Uptime Monitor**      | Monitor website uptime and response times | `/uptime-monitor` | Real-time tracking, command-line visualization |

### **Development & API**

| Tool                       | Description                   | Route             | Features                                      |
| -------------------------- | ----------------------------- | ----------------- | --------------------------------------------- |
| **API Cron Job Scheduler** | Schedule and manage API calls | `/cron-scheduler` | Cron expressions, real-time dashboard         |
| **API Testing Tool**       | Professional API testing tool | `/api-tester`     | Request builder, response viewer, collections |

### **File & Document Tools**

| Tool                          | Description                    | Route              | Features                                        |
| ----------------------------- | ------------------------------ | ------------------ | ----------------------------------------------- |
| **Folder Structure Analyzer** | Analyze directory structures   | `/folder-analyzer` | Tree visualization, multi-format export         |
| **PDF Toolkit**               | Comprehensive PDF manipulation | `/pdf-toolkit`     | Split/merge, rotate, watermarks, text insertion |

### **Design & Creative**

| Tool                    | Description                          | Route              | Features                                          |
| ----------------------- | ------------------------------------ | ------------------ | ------------------------------------------------- |
| **ASCII Art Generator** | Convert text and images to ASCII art | `/ascii-generator` | Multiple fonts, density controls, export options  |
| **Colors Toolkit**      | Comprehensive color tools            | `/colors`          | Color picker, format converter, palette generator |

### **Hardware Testing**

| Tool                     | Description                                  | Route                | Features                                                            |
| ------------------------ | -------------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| **Keyboard Tester**      | Test keyboard functionality and typing speed | `/keyboard-tester`   | Real-time monitoring, typing speed tests, analytics                 |
| **Camera & Mic Tester**  | Test camera and microphone devices           | `/camera-mic-tester` | Real-time monitoring, recording, device management                  |
| **Speaker Testing Tool** | Test speakers and audio systems              | `/speaker-tester`    | Multiple configurations, frequency testing, output device selection |

## 🔧 Scripts

```bash
npm run dev          # Start development server (port 5001)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run lint and format checks
```

## 🌟 Key Features

### 🎨 Modern UI/UX

- **Dark theme** by default with beautiful gradients
- **Responsive design** that works on all devices
- **Accessible components** built with Radix UI
- **Consistent design system** with Tailwind CSS

### ⚡ Performance

- **Next.js 15** with App Router for optimal performance
- **Turbopack** for lightning-fast development builds
- **Optimized bundles** and automatic code splitting
- **SEO optimized** with automated sitemaps

### 🔒 Security & Privacy

- **Client-side processing** - your data never leaves your browser
- **No tracking** of user inputs or generated data
- **Secure algorithms** for cryptographic operations
- **Best practices** for password and security tools

### 🛡️ Developer Experience

- **Full TypeScript** support with strict typing
- **ESLint & Prettier** for code quality
- **Git hooks** with Husky for pre-commit checks
- **Component composition** patterns

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Adding New Tools

1. Create a new component in `src/components/tools/your-tool/`
2. Add the route in `src/app/(tools)/your-tool/page.tsx`
3. Register the tool in `src/config/index.ts`
4. Follow the existing patterns for SEO and styling

### Development Guidelines

- Follow the existing code style (ESLint + Prettier)
- Write TypeScript with proper types
- Use the established component patterns
- Test your tools thoroughly
- Update documentation as needed

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-tool`)
3. Commit your changes (`git commit -m 'Add amazing tool'`)
4. Push to the branch (`git push origin feature/amazing-tool`)
5. Open a Pull Request

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[shadcn](https://twitter.com/shadcn)** for the amazing UI components
- **[Radix UI](https://www.radix-ui.com/)** team for accessible primitives
- **[Vercel](https://vercel.com/)** for Next.js and deployment platform
- **[Tailwind CSS](https://tailwindcss.com/)** team for the utility framework

## 📊 Project Stats

- **25 Tools** currently available
- **16 UI Components** in the design system
- **100% TypeScript** codebase
- **SEO optimized** for all tools
- **Mobile responsive** design
- **0 external API calls** for privacy

## 🔗 Links

- **[Live Demo](https://opensourcetoolkit.com)** - Try the tools online
- **[Issue Tracker](https://github.com/truethari/OpensourceToolkit/issues)** - Report bugs or request features
- **[Discussions](https://github.com/truethari/OpensourceToolkit/discussions)** - Community discussions

---

<div align="center">

**Built with ❤️ by the community, for the community**

⭐ **Star this repo** if you find it useful!

</div>

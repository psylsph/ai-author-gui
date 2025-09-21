# AI Story Author

A modern TypeScript React application that helps you create compelling stories using AI assistance. This web-based GUI is equivalent to the original Python CLI tool but with a beautiful, user-friendly interface.

## Features

- **5-Step Story Planning Process**: Brainstorm, plan, critique, finalize, and develop characters
- **Interactive Workflow**: Step-by-step guidance through the story creation process
- **AI-Powered Writing**: Uses OpenAI/DeepSeek API for intelligent story generation
- **File Upload Support**: Upload text files (.txt, .md) for story prompts
- **Default Prompts**: Includes helpful default prompts to get started quickly
- **Caching System**: Built-in response caching to avoid repeated API calls
- **Chapter Generation**: Write multiple chapters with configurable word count targets, streaming support, feedback functionality, and full chapter text display
- **Export Functionality**: Download your complete story as a text file
- **Modern UI**: Beautiful Material-UI interface with responsive design
- **Environment Variables**: Support for API keys via .env file for local development

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- OpenAI API key or DeepSeek API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-author-gui
```

2. Install dependencies:
```bash
npm install
```

3. **Set up environment variables** (optional):
   - Copy `.env.example` to `.env`
   - Fill in your API keys:
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` with your actual API keys

4. Start the development server:
```bash
npm start
```

### Environment Variables

You can configure API keys using environment variables for local development:

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your API keys:**
   ```bash
   # OpenAI API Configuration
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   REACT_APP_OPENAI_BASE_URL=https://api.openai.com/v1

   # DeepSeek API Configuration
   REACT_APP_DEEPSEEK_API_KEY=your_deepseek_api_key_here
   REACT_APP_DEEPSEEK_BASE_URL=https://api.deepseek.com

   # OpenRouter API Configuration (Free models)
   REACT_APP_OPENROUTER_API_KEY=your_openrouter_api_key_here
   REACT_APP_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   ```

3. **Restart the development server** after making changes to `.env`

**Note:** Environment variables take precedence over localStorage settings. If both are configured, environment variables will be used.

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Configuration

1. **Story Settings**: Enter your story prompt directly on the main page, upload a text file, or use the default children's story prompt
2. **API Settings**: Click the "API Settings" button to configure:
    - API key (OpenAI or DeepSeek)
    - AI model selection
    - Temperature and other advanced settings
    - Chapter word target (default: 3000 words per chapter)
3. Click "Save Configuration" to apply API settings

## Usage

1. **Story Setup**: Enter your story prompt directly on the main page or upload a text file (.txt, .md)
2. **API Configuration**: Click "API Settings" to configure your AI model and API key (required for story generation)
3. **Planning**: Go through the 5-step planning process:
   - Brainstorm & Reflection
   - Intention & Chapter Planning
   - Human vs LLM Critique
   - Final Plan
   - Character Development
4. **Writing**: Generate chapters with AI assistance
5. **Export**: Download your completed story

## API Configuration

The application supports multiple AI providers:

- **OpenAI**: Use GPT-4 or GPT-3.5 Turbo
- **DeepSeek**: Use DeepSeek Reasoner or Chat models
- **Custom**: Configure your own API endpoint

## Deployment

### Netlify Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `build` folder to Netlify:
   - Connect your repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `build`
   - Add environment variables if needed

### Docker Deployment

Deploy the application using Docker for easy local development and production deployment:

#### Prerequisites
- Docker installed on your system
- Docker Compose (optional, for easier deployment)

#### Quick Start with Deployment Script (Easiest)

1. **Run the deployment script**:
```bash
./deploy.sh
```

2. **Open your browser**: Navigate to `http://localhost:3000`

#### Quick Start with Docker Compose (Recommended)

1. **Build and run with one command**:
```bash
docker-compose up --build
```

2. **Open your browser**: Navigate to `http://localhost:3000`

3. **Stop the application**:
```bash
docker-compose down
```

#### Manual Docker Commands

1. **Build the Docker image**:
```bash
docker build -t ai-story-author .
```

2. **Run the container**:
```bash
docker run -p 3000:80 ai-story-author
```

3. **Open your browser**: Navigate to `http://localhost:3000`

#### Docker Features

- **Multi-stage build**: Optimized image size using Node.js for building and Nginx for serving
- **Nginx configuration**: Proper SPA routing support and security headers
- **Static asset caching**: Optimized performance for production
- **Health checks**: Built-in container health monitoring
- **Environment variables**: Support for custom configuration

#### Production Deployment

For production deployment with Docker:

1. **Build for production**:
```bash
docker build -t ai-story-author:prod .
```

2. **Run with production settings**:
```bash
docker run -d -p 80:80 --restart unless-stopped ai-story-author:prod
```

#### Docker Image Details

- **Base image**: `nginx:alpine` (lightweight and secure)
- **Port**: 80 (mapped to 3000 locally)
- **Health check**: Built-in endpoint monitoring
- **Security**: Non-root container with security headers

### Environment Variables

For production deployment, you may want to set:

- `REACT_APP_API_URL`: Custom API endpoint
- `REACT_APP_DEFAULT_MODEL`: Default AI model

## Technology Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Material-UI**: Beautiful component library
- **Axios**: HTTP client for API calls
- **Local Storage**: Client-side caching

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ConfigurationDialog.tsx
│   │   ├── StepContent.tsx
│   │   └── ChapterContent.tsx
│   ├── types.ts            # TypeScript interfaces
│   ├── apiService.ts       # API integration with caching
│   ├── workflowUtils.ts    # Story generation utilities
│   └── App.tsx            # Main application component
├── public/                 # Static assets
├── Dockerfile             # Docker container configuration
├── docker-compose.yml     # Docker Compose orchestration
├── nginx.conf            # Nginx server configuration
├── deploy.sh             # Easy deployment script
├── .dockerignore         # Docker build optimization
└── netlify.toml          # Netlify deployment configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original Python implementation by the AI Author team
- Material-UI for the beautiful component library
- OpenAI and DeepSeek for AI capabilities

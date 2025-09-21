# AI Story Author

A modern TypeScript React application that helps you create compelling stories using AI assistance. This web-based GUI is equivalent to the original Python CLI tool but with a beautiful, user-friendly interface.

## Features

- **5-Step Story Planning Process**: Brainstorm, plan, critique, finalize, and develop characters
- **Interactive Workflow**: Step-by-step guidance through the story creation process
- **AI-Powered Writing**: Uses OpenAI/DeepSeek API for intelligent story generation
- **File Upload Support**: Upload text files (.txt, .md) for story prompts
- **Default Prompts**: Includes helpful default prompts to get started quickly
- **Caching System**: Built-in response caching to avoid repeated API calls
- **Chapter Generation**: Write multiple chapters with word count validation
- **Export Functionality**: Download your complete story as a text file
- **Modern UI**: Beautiful Material-UI interface with responsive design

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

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Configuration

1. **Story Settings**: Enter your story prompt directly on the main page, upload a text file, or use the default children's story prompt
2. **API Settings**: Click the "API Settings" button to configure:
   - API key (OpenAI or DeepSeek)
   - AI model selection
   - Temperature and other advanced settings
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
src/
├── components/          # React components
│   ├── ConfigurationDialog.tsx
│   ├── StepContent.tsx
│   └── ChapterContent.tsx
├── types.ts            # TypeScript interfaces
├── apiService.ts       # API integration with caching
├── workflowUtils.ts    # Story generation utilities
└── App.tsx            # Main application component
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

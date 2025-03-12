# Facebook Quiz Generator

A sophisticated Next.js application for generating and automatically posting engaging quiz images to Facebook pages.

## 🎯 Overview

The Facebook Quiz Generator is a powerful admin dashboard that allows for the creation, management, and automated posting of visually appealing quiz images to Facebook pages. Built with modern technologies and focusing on automation, this application streamlines the process of creating engaging social media content.

## 🚀 Features

### Core Functionality
- ✨ Quiz Template Management
- 🎨 Automated Image Generation
- 📱 Facebook Page Integration
- 📊 Analytics Dashboard
- 🤖 AI-Powered Content Generation
- 📅 Scheduling System

### Quiz Types Support
- 🎯 Wordle-style Letter Games
- ✅ Multiple Choice
- 🖼️ Picture Riddles
- 🔍 Spot the Difference
- 📝 Fill-in-the-blank Challenges

## 🛠️ Technical Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Shadcn/ui Components
- TailwindCSS
- React Query

### Backend
- Next.js API Routes
- Prisma ORM
- Supabase (Storage)
- OpenAI API
- Facebook Graph API

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Facebook Developer Account
- OpenAI API Key
- Supabase Account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd facebook-quiz-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables:
     ```env
     DATABASE_URL="postgresql://user:password@localhost:5432/fbquiz"
     NEXT_PUBLIC_APP_URL="http://localhost:3000"
     
     # Facebook API Configuration
     FACEBOOK_APP_ID=""
     FACEBOOK_APP_SECRET=""
     FACEBOOK_ACCESS_TOKEN=""
     
     # OpenAI Configuration
     OPENAI_API_KEY=""
     
     # Supabase Configuration
     SUPABASE_URL=""
     SUPABASE_KEY=""
     ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier
- Implement proper error handling
- Write comprehensive documentation

### Git Workflow
- Feature branches
- Pull request reviews
- Semantic versioning
- Comprehensive commit messages

## 📈 Future Enhancements

### Planned Features
- Multi-language support
- Advanced template editor
- AI-powered image generation
- Enhanced analytics
- A/B testing system

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

import { QuizType } from '@prisma/client';

export const gradientConcept = {
  name: 'Gradient Concept Connection',
  quizType: QuizType.CONCEPT_CONNECTION,
  html: `
    <div class="quiz-template">
      <div class="quiz-header">
        <h1>{{title}}</h1>
        <p class="subtitle">{{subtitle}}</p>
      </div>
      <div class="quiz-content">
        <div class="concepts-container">
          {{conceptsGrid}}
        </div>
      </div>
      <div class="quiz-footer">
        <p class="branding">{{brandingText}}</p>
      </div>
    </div>
  `,
  css: `
    .quiz-template {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      padding: 3rem;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .quiz-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .quiz-header h1 {
      font-size: 3rem;
      font-weight: 700;
      margin: 0;
      line-height: 1.2;
      background: linear-gradient(135deg, #60a5fa 0%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .subtitle {
      font-size: 1.25rem;
      margin-top: 0.75rem;
      color: #94a3b8;
    }

    .quiz-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
    }

    .concepts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      width: 100%;
      max-width: 800px;
      backdrop-filter: blur(8px);
    }

    .concept-card {
      background: linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(192, 132, 252, 0.1) 100%);
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
      text-align: center;
      cursor: pointer;
      backdrop-filter: blur(8px);
    }

    .concept-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      background: linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(192, 132, 252, 0.2) 100%);
    }

    .concept-text {
      font-size: 1.25rem;
      font-weight: 600;
      color: #e2e8f0;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .concept-card.missing {
      background: rgba(255, 255, 255, 0.05);
      border: 2px dashed rgba(255, 255, 255, 0.2);
    }

    .concept-card.missing .concept-text {
      color: rgba(255, 255, 255, 0.4);
    }

    .quiz-footer {
      text-align: center;
      margin-top: 3rem;
      padding: 1.5rem 2rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      width: 100%;
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
    }

    .branding {
      font-size: 1rem;
      color: #94a3b8;
      background: linear-gradient(135deg, #60a5fa 0%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  `,
  variables: {
    title: "Concepts in Flow",
    subtitle: "Connect the concepts in this colorful journey",
    conceptsGrid: "",
    brandingText: "Flow with Ideas"
  },
}; 
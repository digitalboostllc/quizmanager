import { QuizType } from '@prisma/client';

export const darkSequence = {
  name: 'Dark Mode Number Sequence',
  quizType: QuizType.NUMBER_SEQUENCE,
  html: `
    <div class="quiz-template">
      <div class="quiz-header">
        <h1>{{title}}</h1>
        <p class="subtitle">{{subtitle}}</p>
      </div>
      <div class="quiz-content">
        <div class="sequence-container">
          {{sequence}}
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
      background: #0f172a;
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
      color: #e2e8f0;
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

    .sequence-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      background: #1e293b;
      border-radius: 16px;
      box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.3);
      border: 1px solid #334155;
      width: 100%;
      max-width: 800px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .number-box {
      width: 5rem;
      height: 5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 600;
      background: #334155;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      border: 1px solid #475569;
      color: #e2e8f0;
      transition: all 0.3s ease;
    }

    .number-box:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      background: #475569;
    }

    .number-box.missing {
      background: #1e293b;
      border: 2px dashed #475569;
      color: #64748b;
    }

    .quiz-footer {
      text-align: center;
      margin-top: 3rem;
      padding: 1.5rem 2rem;
      background: #1e293b;
      border-radius: 12px;
      width: 100%;
      border: 1px solid #334155;
    }

    .branding {
      font-size: 1rem;
      color: #64748b;
    }
  `,
  variables: {
    title: "Night Mode Numbers",
    subtitle: "Solve the sequence in the dark",
    sequence: "",
    brandingText: "Dark Pattern Recognition"
  },
}; 
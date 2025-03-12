import { QuizType } from '@prisma/client';

export const modernSequence = {
  name: 'Modern Number Sequence',
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
      background: #ffffff;
      color: #1a1a1a;
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
      color: #1a1a1a;
    }

    .subtitle {
      font-size: 1.25rem;
      margin-top: 0.75rem;
      color: #666;
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
      background: #f8f8f8;
      border-radius: 16px;
      box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1);
      border: 2px solid #eee;
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
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 2px solid #eee;
      color: #1a1a1a;
      transition: all 0.3s ease;
    }

    .number-box:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .number-box.missing {
      background: #f0f0f0;
      border: 2px dashed #ccc;
      color: #999;
    }

    .quiz-footer {
      text-align: center;
      margin-top: 3rem;
      padding: 1.5rem 2rem;
      background: #f8f8f8;
      border-radius: 12px;
      width: 100%;
      border: 2px solid #eee;
    }

    .branding {
      font-size: 1rem;
      color: #666;
    }
  `,
  variables: {
    title: "Number Pattern Challenge",
    subtitle: "Find the missing number in the sequence",
    sequence: "",
    brandingText: "Pattern Recognition"
  },
}; 
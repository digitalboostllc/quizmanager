import { QuizType } from '@prisma/client';

export const darkWordle = {
  name: 'Dark Mode Wordle',
  quizType: QuizType.WORDLE,
  html: `
    <div class="quiz-template">
      <div class="quiz-header">
        <h1>{{title}}</h1>
        <p class="subtitle">{{subtitle}}</p>
      </div>
      <div class="quiz-content">
        <div class="instructions-legend">
          <div class="legend-item">
            <div class="legend-box correct"></div>
            <span class="legend-text">{{correctHint}}</span>
          </div>
          <div class="legend-item">
            <div class="legend-box misplaced"></div>
            <span class="legend-text">{{misplacedHint}}</span>
          </div>
          <div class="legend-item">
            <div class="legend-box wrong"></div>
            <span class="legend-text">{{wrongHint}}</span>
          </div>
        </div>
        {{wordGrid}}
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

    .instructions-legend {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
      background: #1e293b;
      padding: 1.5rem 2rem;
      border-radius: 12px;
      width: 100%;
      border: 1px solid #334155;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .legend-box {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .legend-box.correct {
      background-color: #059669;
    }

    .legend-box.misplaced {
      background-color: #b45309;
    }

    .legend-box.wrong {
      background-color: #334155;
    }

    .legend-text {
      font-size: 0.9rem;
      color: #94a3b8;
      line-height: 1.4;
    }

    .quiz-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
    }

    .word-grid-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }

    .word-attempt {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      justify-content: center;
    }

    .word-grid-row {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .letter-box {
      width: 6rem;
      height: 6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      font-weight: 600;
      border-radius: 12px;
      text-transform: uppercase;
      transition: all 0.3s ease;
      border: 2px solid #1e293b;
    }

    .letter-box.correct {
      background-color: #059669;
      color: white;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
      border: none;
    }

    .letter-box.misplaced {
      background-color: #b45309;
      color: white;
      box-shadow: 0 4px 12px rgba(180, 83, 9, 0.2);
      border: none;
    }

    .letter-box.wrong {
      background-color: #334155;
      color: #94a3b8;
      border: 2px solid #1e293b;
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
    title: "Minimal Word Quest",
    subtitle: "Solve the word puzzle",
    correctHint: "Letter is in the word and in the correct position",
    misplacedHint: "Letter is in the word but in the wrong position",
    wrongHint: "Letter is not in the word",
    wordGrid: "",
    brandingText: "Simple. Clean. Challenging."
  },
}; 
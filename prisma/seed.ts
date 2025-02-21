const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.quiz.deleteMany();
  await prisma.template.deleteMany();

  // Create templates
  const templates = [
    {
      name: 'Modern Wordle',
      quizType: 'WORDLE',
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
          background: #ffffff;
          color: #1a1a1a;
          display: flex;
          flex-direction: column;
          padding: clamp(1rem, 5vw, 3rem);
          font-family: system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: clamp(1rem, 4vw, 2rem);
        }

        .quiz-header h1 {
          font-size: clamp(1.5rem, 4vw, 3rem);
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
          background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          font-size: clamp(0.875rem, 2vw, 1.25rem);
          margin-top: 0.75rem;
          color: #666;
        }

        .instructions-legend {
          display: flex;
          flex-direction: column;
          gap: clamp(0.5rem, 2vw, 0.75rem);
          margin-bottom: clamp(1rem, 4vw, 2rem);
          background: #f8f9fa;
          padding: clamp(1rem, 3vw, 1.5rem) clamp(1.25rem, 4vw, 2rem);
          border-radius: 12px;
          width: 100%;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: clamp(0.5rem, 2vw, 1rem);
        }

        .legend-box {
          width: clamp(1rem, 3vw, 1.5rem);
          height: clamp(1rem, 3vw, 1.5rem);
          border-radius: 4px;
          flex-shrink: 0;
        }

        .legend-box.correct { background-color: #22c55e; }
        .legend-box.misplaced { background-color: #eab308; }
        .legend-box.wrong { background-color: #64748b; }

        .legend-text {
          font-size: clamp(0.75rem, 1.5vw, 0.9rem);
          color: #4b5563;
          line-height: 1.4;
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(1rem, 4vw, 2rem);
        }

        .word-grid-container {
          display: flex;
          flex-direction: column;
          gap: clamp(0.75rem, 3vw, 1.5rem);
          width: 100%;
          max-width: min(600px, 90%);
          margin: 0 auto;
        }

        .word-attempt {
          display: flex;
          align-items: center;
          gap: clamp(0.5rem, 2vw, 1rem);
          width: 100%;
          justify-content: center;
        }

        .attempt-number {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          color: #666;
          min-width: clamp(1.5rem, 4vw, 2rem);
          text-align: right;
        }

        .word-grid-row {
          display: flex;
          gap: clamp(0.375rem, 1.5vw, 0.75rem);
          justify-content: center;
        }

        .letter-box {
          width: clamp(2.5rem, 8vw, 4rem);
          height: clamp(2.5rem, 8vw, 4rem);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(1.25rem, 4vw, 2rem);
          font-weight: 600;
          border-radius: clamp(6px, 2vw, 12px);
          text-transform: uppercase;
          transition: all 0.3s ease;
        }

        .letter-box.correct {
          background-color: #22c55e;
          color: white;
          transform: translateY(clamp(-2px, -1vw, -4px));
          box-shadow: 0 clamp(2px, 1vw, 4px) clamp(6px, 2vw, 12px) rgba(34, 197, 94, 0.2);
        }

        .letter-box.misplaced {
          background-color: #eab308;
          color: white;
          transform: translateY(clamp(-1px, -0.5vw, -2px));
          box-shadow: 0 clamp(2px, 1vw, 4px) clamp(6px, 2vw, 12px) rgba(234, 179, 8, 0.2);
        }

        .letter-box.wrong {
          background-color: #64748b;
          color: white;
          opacity: 0.8;
        }

        .quiz-footer {
          text-align: center;
          margin-top: clamp(1.5rem, 5vw, 3rem);
          padding: clamp(1rem, 3vw, 1.5rem) clamp(1.25rem, 4vw, 2rem);
          background: #f8f9fa;
          border-radius: 12px;
          width: 100%;
        }

        .branding {
          font-size: clamp(0.875rem, 2vw, 1rem);
          color: #999;
        }

        .hint {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          color: #666;
          text-align: center;
          font-style: italic;
          line-height: 1.5;
          margin: 0;
        }

        /* Media query for ultra-small screens */
        @media (max-width: 320px) {
          .quiz-template {
            padding: 0.75rem;
          }
          
          .quiz-header h1 {
            font-size: 1.25rem;
          }
          
          .subtitle {
            font-size: 0.75rem;
          }
          
          .letter-box {
            width: 2rem;
            height: 2rem;
            font-size: 1rem;
          }
        }

        /* Media query for landscape orientation */
        @media (orientation: landscape) and (max-height: 500px) {
          .quiz-template {
            padding: 1rem;
          }
          
          .quiz-header {
            margin-bottom: 0.75rem;
          }
          
          .instructions-legend {
            margin-bottom: 0.75rem;
          }
          
          .word-grid-container {
            gap: 0.5rem;
          }
          
          .letter-box {
            width: 2.5rem;
            height: 2.5rem;
            font-size: 1.25rem;
          }
          
          .quiz-footer {
            margin-top: 0.75rem;
            padding: 0.75rem;
          }
        }
      `,
      variables: {
        title: "Daily Word Challenge",
        subtitle: "Guess the hidden word",
        correctHint: "Letter is in the word and in the correct position",
        misplacedHint: "Letter is in the word but in the wrong position",
        wrongHint: "Letter is not in the word",
        wordGrid: "",
        brandingText: "Play daily to improve your skills!",
      },
    },
    {
      name: 'Dark Mode Wordle',
      quizType: 'WORDLE',
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
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
          background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
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
          gap: 3rem;
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

        .attempt-number {
          font-size: 1.25rem;
          color: #666;
          min-width: 2rem;
          text-align: right;
        }

        .word-grid-row {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .letter-box {
          width: 4rem;
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 600;
          border-radius: 12px;
          text-transform: uppercase;
          transition: all 0.3s ease;
          border: 2px solid #1e293b;
        }

        .letter-box.correct {
          background-color: #059669;
          color: white;
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
          border: none;
        }

        .letter-box.misplaced {
          background-color: #b45309;
          color: white;
          transform: translateY(-2px);
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

        .hint {
          font-size: 1.25rem;
          color: #94a3b8;
          text-align: center;
          font-style: italic;
          line-height: 1.5;
          margin: 0;
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
      `,
      variables: {
        title: "Night Mode Challenge",
        subtitle: "Find the mystery word",
        correctHint: "Letter is in the word and in the correct position",
        misplacedHint: "Letter is in the word but in the wrong position",
        wrongHint: "Letter is not in the word",
        wordGrid: "",
        hint: "Embrace the darkness and let your mind illuminate the path to the hidden word.",
        brandingText: "Join the night owls' word quest",
      },
    },
    {
      name: 'Minimal Wordle',
      quizType: 'WORDLE',
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
          background: #fafafa;
          color: #262626;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 2.5rem;
          font-weight: 300;
          margin: 0;
          line-height: 1.2;
          letter-spacing: 0.1em;
        }

        .subtitle {
          font-size: 1.125rem;
          margin-top: 0.75rem;
          color: #525252;
          font-weight: 300;
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3rem;
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

        .attempt-number {
          font-size: 1.25rem;
          color: #666;
          min-width: 2rem;
          text-align: right;
        }

        .word-grid-row {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .letter-box {
          width: 4rem;
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 300;
          border-radius: 4px;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .letter-box.correct {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #166534;
        }

        .letter-box.misplaced {
          background-color: #fef9c3;
          color: #854d0e;
          border: 1px solid #854d0e;
        }

        .letter-box.wrong {
          background-color: #f4f4f5;
          color: #71717a;
          border: 1px solid #71717a;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 4px;
          width: 100%;
          border: 1px solid #e5e5e5;
        }

        .branding {
          font-size: 0.875rem;
          color: #737373;
          font-weight: 300;
          letter-spacing: 0.05em;
        }

        .hint {
          font-size: 1.125rem;
          color: #525252;
          text-align: center;
          font-weight: 300;
          font-style: italic;
          line-height: 1.5;
          letter-spacing: 0.025em;
          margin: 0;
        }

        .instructions-legend {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
          background: white;
          padding: 1.5rem 2rem;
          border-radius: 4px;
          width: 100%;
          border: 1px solid #e5e5e5;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .legend-box {
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .legend-box.correct {
          background-color: #dcfce7;
          border: 1px solid #166534;
        }

        .legend-box.misplaced {
          background-color: #fef9c3;
          border: 1px solid #854d0e;
        }

        .legend-box.wrong {
          background-color: #f4f4f5;
          border: 1px solid #71717a;
        }

        .legend-text {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.4;
          font-weight: 300;
          letter-spacing: 0.025em;
        }
      `,
      variables: {
        title: "Minimal Word Puzzle",
        subtitle: "Simplicity is the ultimate sophistication",
        correctHint: "Letter is in the word and in the correct position",
        misplacedHint: "Letter is in the word but in the wrong position",
        wrongHint: "Letter is not in the word",
        wordGrid: "",
        hint: "In simplicity lies the ultimate challenge - find the word that completes the puzzle.",
        brandingText: "Less is more",
      },
    },
    {
      name: 'Gradient Wordle',
      quizType: 'WORDLE',
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
          background: linear-gradient(135deg, #f6f8ff 0%, #f0f4ff 100%);
          color: #1e293b;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3rem;
        }

        .instructions-legend {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.8);
          padding: 1.5rem 2rem;
          border-radius: 16px;
          width: 100%;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                     0 2px 4px -2px rgba(0, 0, 0, 0.1);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .legend-box {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .legend-box.correct {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);
        }

        .legend-box.misplaced {
          background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
          box-shadow: 0 2px 4px rgba(234, 179, 8, 0.2);
        }

        .legend-box.wrong {
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
          box-shadow: 0 2px 4px rgba(148, 163, 184, 0.2);
        }

        .legend-text {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.4;
          font-weight: 500;
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

        .attempt-number {
          font-size: 1.25rem;
          color: #64748b;
          min-width: 2rem;
          text-align: right;
          font-weight: 600;
        }

        .word-grid-row {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .letter-box {
          width: 4rem;
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          border-radius: 16px;
          text-transform: uppercase;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .letter-box.correct {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
          border: none;
        }

        .letter-box.misplaced {
          background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(234, 179, 8, 0.2);
          border: none;
        }

        .letter-box.wrong {
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
          color: white;
          border: none;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 16px;
          width: 100%;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                     0 2px 4px -2px rgba(0, 0, 0, 0.1);
        }

        .branding {
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
        }
      `,
      variables: {
        title: "Gradient Word Quest",
        subtitle: "Discover the hidden word",
        correctHint: "Letter is in the word and in the correct position",
        misplacedHint: "Letter is in the word but in the wrong position",
        wrongHint: "Letter is not in the word",
        wordGrid: "",
        hint: "Follow the gradient of clues to uncover the mystery word.",
        brandingText: "Elevate your word game",
      },
    },
    {
      name: 'Neon Wordle',
      quizType: 'WORDLE',
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
          background: #0c0c1d;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3.5rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          color: #fff;
          text-shadow: 0 0 10px #4f46e5,
                     0 0 20px #4f46e5,
                     0 0 30px #4f46e5,
                     0 0 40px #4f46e5;
          letter-spacing: 0.1em;
          animation: neon-pulse 1.5s ease-in-out infinite alternate;
        }

        @keyframes neon-pulse {
          from {
            text-shadow: 0 0 10px #4f46e5,
                       0 0 20px #4f46e5,
                       0 0 30px #4f46e5,
                       0 0 40px #4f46e5;
          }
          to {
            text-shadow: 0 0 5px #4f46e5,
                       0 0 10px #4f46e5,
                       0 0 15px #4f46e5,
                       0 0 20px #4f46e5;
          }
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 1rem;
          color: #a5b4fc;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3rem;
        }

        .instructions-legend {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
          background: rgba(79, 70, 229, 0.1);
          padding: 1.5rem 2rem;
          border-radius: 8px;
          width: 100%;
          border: 1px solid rgba(79, 70, 229, 0.2);
          box-shadow: 0 0 20px rgba(79, 70, 229, 0.2);
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
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
        }

        .legend-box.misplaced {
          background: #f59e0b;
          box-shadow: 0 0 10px #f59e0b;
        }

        .legend-box.wrong {
          background: #6366f1;
          box-shadow: 0 0 10px #6366f1;
        }

        .legend-text {
          font-size: 0.9rem;
          color: #c7d2fe;
          line-height: 1.4;
          font-weight: 500;
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

        .attempt-number {
          font-size: 1.25rem;
          color: #818cf8;
          min-width: 2rem;
          text-align: right;
          font-weight: 600;
          text-shadow: 0 0 5px #818cf8;
        }

        .word-grid-row {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .letter-box {
          width: 4rem;
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          border-radius: 8px;
          text-transform: uppercase;
          transition: all 0.3s ease;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: #c7d2fe;
          text-shadow: 0 0 5px #c7d2fe;
        }

        .letter-box.correct {
          background: #10b981;
          color: white;
          transform: translateY(-4px);
          box-shadow: 0 0 20px #10b981;
          border: none;
          text-shadow: 0 0 10px white;
        }

        .letter-box.misplaced {
          background: #f59e0b;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 0 20px #f59e0b;
          border: none;
          text-shadow: 0 0 10px white;
        }

        .letter-box.wrong {
          background: #6366f1;
          color: white;
          box-shadow: 0 0 20px #6366f1;
          border: none;
          text-shadow: 0 0 10px white;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: rgba(79, 70, 229, 0.1);
          border-radius: 12px;
          width: 100%;
          border: 1px solid rgba(79, 70, 229, 0.3);
          box-shadow: 0 0 20px rgba(79, 70, 229, 0.2);
        }

        .branding {
          font-size: 1rem;
          color: #a5b4fc;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-shadow: 0 0 5px #4f46e5;
        }
      `,
      variables: {
        title: "Neon Word Pulse",
        subtitle: "Enter the Neon Realm",
        correctHint: "Letter is in the word and in the correct position",
        misplacedHint: "Letter is in the word but in the wrong position",
        wrongHint: "Letter is not in the word",
        wordGrid: "",
        hint: "Let the neon lights guide you to the hidden word.",
        brandingText: "Illuminate your mind",
      },
    },
    {
      name: 'Fitness Goals',
      quizType: 'NUMBER_SEQUENCE',
      html: `
        <div class="quiz-template">
          <div class="quiz-header">
            <h1>{{title}}</h1>
            <p class="subtitle">{{subtitle}}</p>
          </div>
          <div class="quiz-content">
            <div class="sequence-container">
              <div class="sequence-numbers">{{sequence}}</div>
              <div class="sequence-question">
                <span class="question-mark">?</span>
              </div>
            </div>
            <div class="hint-container">
              <p class="hint">{{hint}}</p>
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
          background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
          color: #1e293b;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 0.75rem;
          color: white;
          opacity: 0.9;
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
          gap: 1.5rem;
          background: rgba(255, 255, 255, 0.9);
          padding: 2rem 3rem;
          border-radius: 16px;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .sequence-numbers {
          font-size: 2.5rem;
          font-weight: 700;
          color: #059669;
          letter-spacing: 0.1em;
        }

        .sequence-question {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 4rem;
          height: 4rem;
          background: #059669;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
        }

        .question-mark {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
        }

        .hint-container {
          text-align: center;
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .hint {
          font-size: 1.25rem;
          color: #059669;
          font-style: italic;
          margin: 0;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          width: 100%;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .branding {
          font-size: 1rem;
          color: #059669;
          font-weight: 500;
        }
      `,
      variables: {
        title: "Fitness Progress Pattern",
        subtitle: "Track your workout gains",
        sequence: "2, 4, 8, 16, 32",
        hint: "Just like your fitness goals, these numbers keep growing...",
        brandingText: "Every rep counts",
      },
    },
    {
      name: 'Mindful Minutes',
      quizType: 'NUMBER_SEQUENCE',
      html: `
        <div class="quiz-template">
          <div class="quiz-header">
            <h1>{{title}}</h1>
            <p class="subtitle">{{subtitle}}</p>
          </div>
          <div class="quiz-content">
            <div class="sequence-container">
              <div class="sequence-numbers">{{sequence}}</div>
              <div class="sequence-question">
                <span class="question-mark">?</span>
              </div>
            </div>
            <div class="hint-container">
                <p class="hint">{{hint}}</p>
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
          background: linear-gradient(135deg, #fdf2f8 0%, #ede9fe 100%);
          color: #1e293b;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          background: linear-gradient(135deg, #be185d 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 0.75rem;
          color: #6b7280;
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
          gap: 1.5rem;
          background: white;
          padding: 2rem 3rem;
          border-radius: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                     0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }

        .sequence-numbers {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #be185d 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 0.1em;
        }

        .sequence-question {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, #be185d 0%, #7c3aed 100%);
          border-radius: 24px;
          box-shadow: 0 8px 16px -4px rgba(190, 24, 93, 0.2);
        }

        .question-mark {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
        }

        .hint-container {
          text-align: center;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                     0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }

        .hint {
          font-size: 1.25rem;
          color: #6b7280;
          font-style: italic;
          margin: 0;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 24px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                     0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }

        .branding {
          font-size: 1rem;
          color: #6b7280;
          font-weight: 500;
        }
      `,
      variables: {
        title: "Mindful Minutes Pattern",
        subtitle: "Grow your meditation practice",
        sequence: "5, 10, 15, 20, 25",
        hint: "Like meditation, progress comes in steady increments...",
        brandingText: "Find your inner peace",
      },
    },
    {
      name: 'Sleep Cycles',
      quizType: 'NUMBER_SEQUENCE',
      html: `
        <div class="quiz-template">
          <div class="quiz-header">
            <h1>{{title}}</h1>
            <p class="subtitle">{{subtitle}}</p>
          </div>
          <div class="quiz-content">
            <div class="sequence-container">
              <div class="sequence-numbers">{{sequence}}</div>
              <div class="sequence-question">
                <span class="question-mark">?</span>
              </div>
            </div>
            <div class="hint-container">
              <p class="hint">{{hint}}</p>
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
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          color: #e2e8f0;
          text-shadow: 0 0 20px rgba(226, 232, 240, 0.3);
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
          gap: 1.5rem;
          background: rgba(226, 232, 240, 0.1);
          padding: 2rem 3rem;
          border-radius: 16px;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(226, 232, 240, 0.1);
        }

        .sequence-numbers {
          font-size: 2.5rem;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: 0.1em;
          text-shadow: 0 0 20px rgba(226, 232, 240, 0.3);
        }

        .sequence-question {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 4rem;
          height: 4rem;
          background: rgba(226, 232, 240, 0.1);
          border: 1px solid rgba(226, 232, 240, 0.2);
          border-radius: 12px;
        }

        .question-mark {
          font-size: 2.5rem;
          font-weight: 700;
          color: #94a3b8;
          text-shadow: 0 0 20px rgba(148, 163, 184, 0.3);
        }

        .hint-container {
          text-align: center;
          padding: 1.5rem 2rem;
          background: rgba(226, 232, 240, 0.1);
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(226, 232, 240, 0.1);
        }

        .hint {
          font-size: 1.25rem;
          color: #94a3b8;
          font-style: italic;
          margin: 0;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: rgba(226, 232, 240, 0.1);
          border-radius: 16px;
          width: 100%;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(226, 232, 240, 0.1);
        }

        .branding {
          font-size: 1rem;
          color: #94a3b8;
          font-weight: 500;
        }
      `,
      variables: {
        title: "Sleep Cycle Sequence",
        subtitle: "Track your rest patterns",
        sequence: "90, 180, 270, 360, 450",
        hint: "Like sleep cycles, these numbers follow a natural rhythm...",
        brandingText: "Rest well, live better",
      },
    },
    {
      name: 'Calorie Counter',
      quizType: 'NUMBER_SEQUENCE',
      html: `
        <div class="quiz-template">
          <div class="quiz-header">
            <h1>{{title}}</h1>
            <p class="subtitle">{{subtitle}}</p>
          </div>
          <div class="quiz-content">
            <div class="sequence-container">
              <div class="sequence-numbers">{{sequence}}</div>
              <div class="sequence-question">
                <span class="question-mark">?</span>
              </div>
            </div>
            <div class="hint-container">
              <p class="hint">{{hint}}</p>
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
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #1e293b;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          color: #92400e;
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 0.75rem;
          color: #b45309;
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
          gap: 1.5rem;
          background: white;
          padding: 2rem 3rem;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(146, 64, 14, 0.1),
                     0 8px 10px -6px rgba(146, 64, 14, 0.1);
        }

        .sequence-numbers {
          font-size: 2.5rem;
          font-weight: 700;
          color: #92400e;
          letter-spacing: 0.1em;
        }

        .sequence-question {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 4rem;
          height: 4rem;
          background: #92400e;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(146, 64, 14, 0.2);
        }

        .question-mark {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
        }

        .hint-container {
          text-align: center;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 20px 25px -5px rgba(146, 64, 14, 0.1),
                     0 8px 10px -6px rgba(146, 64, 14, 0.1);
        }

        .hint {
          font-size: 1.25rem;
          color: #92400e;
          font-style: italic;
          margin: 0;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(146, 64, 14, 0.1),
                     0 8px 10px -6px rgba(146, 64, 14, 0.1);
        }

        .branding {
          font-size: 1rem;
          color: #92400e;
          font-weight: 500;
        }
      `,
      variables: {
        title: "Calorie Count Pattern",
        subtitle: "Balance your nutrition",
        sequence: "100, 200, 300, 400, 500",
        hint: "Like counting calories, these numbers add up systematically...",
        brandingText: "Nourish your body, feed your mind",
      },
    },
    {
      name: 'Concept Connection',
      quizType: 'CONCEPT_CONNECTION',
      html: `
        <div class="quiz-template">
          <div class="quiz-header">
            <h1>{{title}}</h1>
            <p class="subtitle">{{subtitle}}</p>
          </div>
          <div class="quiz-content">
            <div class="concepts-grid">
              {{conceptsGrid}}
            </div>
            <div class="hint-container">
              <p class="hint">{{hint}}</p>
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
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%);
          color: #1e293b;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          background: linear-gradient(135deg, #047857 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 0.75rem;
          color: #6b7280;
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3rem;
        }

        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 800px;
          width: 100%;
        }

        .concept-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
          cursor: pointer;
        }

        .concept-card:hover {
          transform: translateY(-4px);
        }

        .concept-text {
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
        }

        .hint-container {
          text-align: center;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                     0 2px 4px -2px rgba(0, 0, 0, 0.1);
        }

        .hint {
          font-size: 1.25rem;
          color: #6b7280;
          font-style: italic;
          margin: 0;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          width: 100%;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                     0 2px 4px -2px rgba(0, 0, 0, 0.1);
        }

        .branding {
          font-size: 1rem;
          color: #6b7280;
          font-weight: 500;
        }
      `,
      variables: {
        title: "Connect the Concepts",
        subtitle: "Find the common thread",
        conceptsGrid: `
          <div class="concept-card">
            <span class="concept-text">RAIN</span>
          </div>
          <div class="concept-card">
            <span class="concept-text">SNOW</span>
          </div>
          <div class="concept-card">
            <span class="concept-text">HAIL</span>
          </div>
          <div class="concept-card">
            <span class="concept-text">SLEET</span>
          </div>
        `,
        hint: "What category connects all these words?",
        brandingText: "Connect the dots of knowledge",
      },
    },
    {
      name: 'Healthy Foods',
      quizType: 'CONCEPT_CONNECTION',
      html: `
        <div class="quiz-template">
          <div class="quiz-header">
            <h1>{{title}}</h1>
            <p class="subtitle">{{subtitle}}</p>
          </div>
          <div class="quiz-content">
            <div class="concepts-grid">
              {{conceptsGrid}}
            </div>
            <div class="hint-container">
              <p class="hint">{{hint}}</p>
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
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #166534;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          color: #166534;
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 0.75rem;
          color: #15803d;
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3rem;
        }

        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 800px;
          width: 100%;
        }

        .concept-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
          border: 2px solid #86efac;
        }

        .concept-card:hover {
          transform: translateY(-4px);
        }

        .concept-text {
          font-size: 1.5rem;
          font-weight: 600;
          color: #166534;
        }

        .hint-container {
          text-align: center;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          border: 2px solid #86efac;
        }

        .hint {
          font-size: 1.25rem;
          color: #15803d;
          font-style: italic;
          margin: 0;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          width: 100%;
          border: 2px solid #86efac;
        }

        .branding {
          font-size: 1rem;
          color: #15803d;
          font-weight: 500;
        }
      `,
      variables: {
        title: "Nutritious Connections",
        subtitle: "Find the common theme linking these healthy items",
        conceptsGrid: `
          <div class="concept-card"><span class="concept-text">QUINOA</span></div>
          <div class="concept-card"><span class="concept-text">KALE</span></div>
          <div class="concept-card"><span class="concept-text">CHIA</span></div>
          <div class="concept-card"><span class="concept-text">ACAI</span></div>
        `,
        hint: "These superfoods pack a powerful nutritional punch!",
        brandingText: "Superfood Synergy",
      },
    },
    {
      name: 'Fitness Activities',
      quizType: 'CONCEPT_CONNECTION',
      html: `
        <div class="quiz-template">
          <div class="quiz-header">
            <h1>{{title}}</h1>
            <p class="subtitle">{{subtitle}}</p>
          </div>
          <div class="quiz-content">
            <div class="concepts-grid">
              {{conceptsGrid}}
            </div>
            <div class="hint-container">
              <p class="hint">{{hint}}</p>
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
          background: linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%);
          color: #0c4a6e;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          color: #0c4a6e;
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 0.75rem;
          color: #0369a1;
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3rem;
        }

        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 800px;
          width: 100%;
        }

        .concept-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
          border: 2px solid #38bdf8;
        }

        .concept-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.1);
        }

        .concept-text {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0c4a6e;
        }

        .hint-container {
          text-align: center;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          border: 2px solid #38bdf8;
        }

        .hint {
          font-size: 1.25rem;
          color: #0369a1;
          font-style: italic;
          margin: 0;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          width: 100%;
          border: 2px solid #38bdf8;
        }

        .branding {
          font-size: 1rem;
          color: #0369a1;
          font-weight: 500;
        }
      `,
      variables: {
        title: "Active Lifestyle Links",
        subtitle: "Connect these energetic activities",
        conceptsGrid: `
          <div class="concept-card"><span class="concept-text">YOGA</span></div>
          <div class="concept-card"><span class="concept-text">PILATES</span></div>
          <div class="concept-card"><span class="concept-text">BARRE</span></div>
          <div class="concept-card"><span class="concept-text">STRETCHING</span></div>
        `,
        hint: "These activities focus on flexibility and core strength!",
        brandingText: "Flex & Flow",
      },
    },
    {
      name: 'Mindful Practices',
      quizType: 'CONCEPT_CONNECTION',
      html: `
        <div class="quiz-template">
          <div class="quiz-header">
            <h1>{{title}}</h1>
            <p class="subtitle">{{subtitle}}</p>
          </div>
          <div class="quiz-content">
            <div class="concepts-grid">
              {{conceptsGrid}}
            </div>
            <div class="hint-container">
              <p class="hint">{{hint}}</p>
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
          background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%);
          color: #5b21b6;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          color: #5b21b6;
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 0.75rem;
          color: #6d28d9;
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3rem;
        }

        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 800px;
          width: 100%;
        }

        .concept-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
          border: 2px solid #a78bfa;
        }

        .concept-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.1);
        }

        .concept-text {
          font-size: 1.5rem;
          font-weight: 600;
          color: #5b21b6;
        }

        .hint-container {
          text-align: center;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          border: 2px solid #a78bfa;
        }

        .hint {
          font-size: 1.25rem;
          color: #6d28d9;
          font-style: italic;
          margin: 0;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          width: 100%;
          border: 2px solid #a78bfa;
        }

        .branding {
          font-size: 1rem;
          color: #6d28d9;
          font-weight: 500;
        }
      `,
      variables: {
        title: "Mindfulness Moments",
        subtitle: "Discover the connection between these peaceful practices",
        conceptsGrid: `
          <div class="concept-card"><span class="concept-text">MEDITATION</span></div>
          <div class="concept-card"><span class="concept-text">BREATHING</span></div>
          <div class="concept-card"><span class="concept-text">JOURNALING</span></div>
          <div class="concept-card"><span class="concept-text">REFLECTION</span></div>
        `,
        hint: "These practices help cultivate inner peace and awareness",
        brandingText: "Peace Within",
      },
    },
    {
      name: 'Sleep Essentials',
      quizType: 'CONCEPT_CONNECTION',
      html: `
        <div class="quiz-template">
          <div class="quiz-header">
            <h1>{{title}}</h1>
            <p class="subtitle">{{subtitle}}</p>
          </div>
          <div class="quiz-content">
            <div class="concepts-grid">
              {{conceptsGrid}}
            </div>
            <div class="hint-container">
              <p class="hint">{{hint}}</p>
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
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%);
          color: #e0e7ff;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
          position: relative;
        }

        .quiz-template::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at top right, rgba(165, 180, 252, 0.2), transparent 70%);
          pointer-events: none;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          background: linear-gradient(135deg, #818cf8 0%, #c7d2fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 0.75rem;
          color: #a5b4fc;
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3rem;
          position: relative;
        }

        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 800px;
          width: 100%;
        }

        .concept-card {
          background: rgba(255, 255, 255, 0.1);
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
          border: 1px solid rgba(165, 180, 252, 0.2);
          backdrop-filter: blur(8px);
        }

        .concept-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 20px -4px rgba(0, 0, 0, 0.4);
          border-color: rgba(165, 180, 252, 0.4);
          background: rgba(255, 255, 255, 0.15);
        }

        .concept-text {
          font-size: 1.5rem;
          font-weight: 600;
          color: #e0e7ff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .hint-container {
          text-align: center;
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(165, 180, 252, 0.2);
          backdrop-filter: blur(8px);
        }

        .hint {
          font-size: 1.25rem;
          color: #a5b4fc;
          font-style: italic;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          width: 100%;
          box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(165, 180, 252, 0.2);
          backdrop-filter: blur(8px);
        }

        .branding {
          font-size: 1rem;
          color: #a5b4fc;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `,
      variables: {
        title: "What Makes Perfect Sleep?",
        subtitle: "Connect these sleep essentials",
        conceptsGrid: `
          <div class="concept-card"><span class="concept-text">DARKNESS</span></div>
          <div class="concept-card"><span class="concept-text">SILENCE</span></div>
          <div class="concept-card"><span class="concept-text">COOLNESS</span></div>
          <div class="concept-card"><span class="concept-text">COMFORT</span></div>
        `,
        hint: "These elements are essential for quality sleep",
        brandingText: "Sleep Well"
      }
    },
    {
      name: 'Mental Wellness',
      quizType: 'CONCEPT_CONNECTION',
      html: `
        <div class="quiz-template">
          <div class="quiz-header">
            <h1>{{title}}</h1>
            <p class="subtitle">{{subtitle}}</p>
          </div>
          <div class="quiz-content">
            <div class="concepts-grid">
              {{conceptsGrid}}
            </div>
            <div class="hint-container">
              <p class="hint">{{hint}}</p>
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
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #f5f3ff 100%);
          color: #1e293b;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          font-family: system-ui, -apple-system, sans-serif;
          position: relative;
        }

        .quiz-template::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at bottom right, rgba(147, 51, 234, 0.1), transparent 70%);
          pointer-events: none;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
        }

        .quiz-header h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          background: linear-gradient(135deg, #7e22ce 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          font-size: 1.25rem;
          margin-top: 0.75rem;
          color: #7e22ce;
        }

        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 800px;
          width: 100%;
        }

        .concept-card {
          background: rgba(255, 255, 255, 0.9);
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 15px -3px rgba(147, 51, 234, 0.1);
          transition: all 0.3s ease;
          border: 1px solid rgba(147, 51, 234, 0.1);
          backdrop-filter: blur(8px);
        }

        .concept-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 20px -4px rgba(147, 51, 234, 0.2);
          border-color: rgba(147, 51, 234, 0.3);
        }

        .concept-text {
          font-size: 1.5rem;
          font-weight: 600;
          color: #7e22ce;
        }

        .hint-container {
          text-align: center;
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 4px 15px -3px rgba(147, 51, 234, 0.1);
          border: 1px solid rgba(147, 51, 234, 0.1);
          backdrop-filter: blur(8px);
        }

        .hint {
          font-size: 1.25rem;
          color: #7e22ce;
          font-style: italic;
          margin: 0;
        }

        .quiz-footer {
          text-align: center;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          width: 100%;
          box-shadow: 0 4px 15px -3px rgba(147, 51, 234, 0.1);
          border: 1px solid rgba(147, 51, 234, 0.1);
          backdrop-filter: blur(8px);
        }

        .branding {
          font-size: 1rem;
          color: #7e22ce;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
      `,
      variables: {
        title: "What Builds Mental Strength?",
        subtitle: "Connect these mental wellness practices",
        conceptsGrid: `
          <div class="concept-card"><span class="concept-text">GRATITUDE</span></div>
          <div class="concept-card"><span class="concept-text">MINDFULNESS</span></div>
          <div class="concept-card"><span class="concept-text">REFLECTION</span></div>
          <div class="concept-card"><span class="concept-text">MEDITATION</span></div>
        `,
        hint: "These practices strengthen your mental well-being",
        brandingText: "Mind Matters",
      },
    },
    {
      name: 'Responsive Wordle',
      quizType: 'WORDLE',
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
        /* CSS Custom Properties for easy theming and responsive adjustments */
        :root {
          --primary-color: #2563eb;
          --correct-color: #22c55e;
          --misplaced-color: #eab308;
          --wrong-color: #64748b;
          --background-color: #ffffff;
          --text-color: #1a1a1a;
          --muted-text: #666666;
          --border-radius: 12px;
          --spacing-unit: clamp(0.5rem, 2vw, 1rem);
          --content-width: min(100%, 1200px);
          --letter-box-size: clamp(2rem, min(8vw, 8vh), 4rem);
          --title-size: clamp(1.5rem, 5vw, 3rem);
          --subtitle-size: clamp(1rem, 3vw, 1.25rem);
          --legend-text-size: clamp(0.75rem, 2vw, 0.9rem);
          --letter-size: clamp(1rem, min(4vw, 4vh), 2rem);
          --grid-gap: clamp(0.25rem, 1vw, 0.75rem);
        }

        /* Base styles with responsive units */
        .quiz-template {
          width: 100%;
          height: 100%;
          background: var(--background-color);
          color: var(--text-color);
          display: flex;
          flex-direction: column;
          padding: var(--spacing-unit);
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0 auto;
          max-width: var(--content-width);
          box-sizing: border-box;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: calc(var(--spacing-unit) * 3);
        }

        .quiz-header h1 {
          font-size: var(--title-size);
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
          background: linear-gradient(135deg, var(--primary-color) 0%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          padding: 0 var(--spacing-unit);
        }

        .subtitle {
          font-size: var(--subtitle-size);
          margin-top: calc(var(--spacing-unit) * 0.75);
          color: var(--muted-text);
        }

        .quiz-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: calc(var(--spacing-unit) * 2);
        }

        /* Responsive grid layout */
        .word-grid-container {
          display: flex;
          flex-direction: column;
          gap: var(--grid-gap);
          width: 100%;
          max-width: min(500px, 95%);
          margin: 0 auto;
          padding: var(--spacing-unit);
        }

        .word-attempt {
          display: flex;
          align-items: center;
          gap: var(--grid-gap);
          width: 100%;
          justify-content: center;
        }

        .attempt-number {
          min-width: 1.5rem;
          text-align: right;
          font-size: var(--legend-text-size);
          color: var(--muted-text);
        }

        .word-grid-row {
          display: flex;
          gap: var(--grid-gap);
          justify-content: center;
          flex-wrap: nowrap;
          flex: 1;
        }

        /* Responsive letter boxes */
        .letter-box {
          width: var(--letter-box-size);
          height: var(--letter-box-size);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--letter-size);
          font-weight: 600;
          border-radius: calc(var(--border-radius) / 2);
          text-transform: uppercase;
          transition: all 0.3s ease;
          border: 2px solid #e2e8f0;
          flex-shrink: 0;
        }

        .letter-box.correct {
          background-color: var(--correct-color);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
          border: none;
        }

        .letter-box.misplaced {
          background-color: var(--misplaced-color);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(234, 179, 8, 0.2);
          border: none;
        }

        .letter-box.wrong {
          background-color: var(--wrong-color);
          color: white;
          border: none;
        }

        /* Responsive legend */
        .instructions-legend {
          display: flex;
          flex-direction: column;
          gap: calc(var(--spacing-unit) * 0.75);
          margin-bottom: calc(var(--spacing-unit) * 2);
          background: #f8f9fa;
          padding: calc(var(--spacing-unit) * 1.5);
          border-radius: var(--border-radius);
          width: 100%;
          max-width: min(600px, 90vw);
          margin: 0 auto;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-unit);
        }

        .legend-box {
          width: calc(var(--spacing-unit) * 1.5);
          height: calc(var(--spacing-unit) * 1.5);
          border-radius: calc(var(--border-radius) / 3);
          flex-shrink: 0;
        }

        .legend-box.correct {
          background-color: var(--correct-color);
        }

        .legend-box.misplaced {
          background-color: var(--misplaced-color);
        }

        .legend-box.wrong {
          background-color: var(--wrong-color);
        }

        .legend-text {
          font-size: var(--legend-text-size);
          color: var(--muted-text);
          line-height: 1.4;
        }

        /* Responsive footer */
        .quiz-footer {
          text-align: center;
          margin-top: calc(var(--spacing-unit) * 3);
          padding: calc(var(--spacing-unit) * 1.5);
          background: #f8f9fa;
          border-radius: var(--border-radius);
          width: 100%;
          max-width: min(600px, 90vw);
          margin: calc(var(--spacing-unit) * 3) auto 0;
        }

        .branding {
          font-size: var(--legend-text-size);
          color: var(--muted-text);
        }

        /* Media query for ultra-small screens */
        @media (max-width: 320px) {
          :root {
            --spacing-unit: 0.25rem;
            --letter-box-size: clamp(1.75rem, 6vw, 2rem);
            --letter-size: clamp(0.875rem, 3vw, 1rem);
            --grid-gap: 0.25rem;
          }

          .word-grid-container {
            padding: calc(var(--spacing-unit) / 2);
          }

          .attempt-number {
            min-width: 1rem;
            font-size: 0.75rem;
          }
        }

        /* Media query for landscape orientation */
        @media (orientation: landscape) and (max-height: 600px) {
          :root {
            --letter-box-size: clamp(1.75rem, 8vh, 3rem);
            --letter-size: clamp(0.875rem, 4vh, 1.5rem);
          }

          .quiz-template {
            padding: calc(var(--spacing-unit) * 0.5);
          }

          .word-grid-container {
            padding: calc(var(--spacing-unit) * 0.5);
            gap: calc(var(--grid-gap) * 0.75);
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          :root {
            --primary-color: #0000ff;
            --correct-color: #008000;
            --misplaced-color: #b8860b;
            --wrong-color: #000000;
            --text-color: #000000;
            --muted-text: #404040;
          }

          .letter-box {
            border: 2px solid currentColor;
          }
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .letter-box {
            transition: none;
            transform: none !important;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          :root {
            --background-color: #0f172a;
            --text-color: #e2e8f0;
            --muted-text: #94a3b8;
            --primary-color: #60a5fa;
          }

          .instructions-legend,
          .quiz-footer {
            background: #1e293b;
          }

          .letter-box {
            border-color: #1e293b;
          }
        }
      `,
      variables: {
        title: "Adaptive Word Challenge",
        subtitle: "A responsive word puzzle that looks great everywhere",
        correctHint: "Letter is in the word and in the correct position",
        misplacedHint: "Letter is in the word but in the wrong position",
        wrongHint: "Letter is not in the word",
        wordGrid: "",
        brandingText: "Play on any device, any time!",
      },
    },
  ];

  // Create templates in database
  for (const template of templates) {
    await prisma.template.create({
      data: template,
    });
  }

  console.log('Database has been seeded with new templates! 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
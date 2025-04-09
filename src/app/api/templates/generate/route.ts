import openai from "@/lib/openai";
import { NextResponse } from 'next/server';

// Template type definition
type Template = {
  id?: string;
  name: string;
  description?: string;
  html: string;
  css: string;
  variables: Record<string, any>;
  quizType: string;
  isPublic?: boolean;
};

// Default template for each quiz type
const defaultTemplates = {
  WORDLE: {
    name: "Modern Wordle",
    quizType: "WORDLE",
    html: `<div class="quiz-template">
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
    <div class="word-grid-container">
      {{wordGrid}}
    </div>
  </div>
  <div class="quiz-footer">
    <p class="branding">{{brandingText}}</p>
  </div>
</div>`,
    css: `.quiz-template {
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
  background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.25rem;
  margin-top: 0.75rem;
  color: #666;
}

.instructions-legend {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  background: #f8f9fa;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  width: 100%;
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
  background-color: #22c55e;
}

.legend-box.misplaced {
  background-color: #eab308;
}

.legend-box.wrong {
  background-color: #64748b;
}

.legend-text {
  font-size: 0.9rem;
  color: #4b5563;
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
  gap: 0.75rem;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
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
  border-radius: 8px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  border: 2px solid #d1d5db;
}

.letter-box.correct {
  background-color: #22c55e;
  color: white;
  border-color: #22c55e;
}

.letter-box.misplaced {
  background-color: #eab308;
  color: white;
  border-color: #eab308;
}

.letter-box.wrong {
  background-color: #64748b;
  color: white;
  border-color: #64748b;
}

.quiz-footer {
  text-align: center;
  margin-top: 2rem;
  padding: 1rem;
  color: #6b7280;
}

.branding {
  font-size: 0.875rem;
  opacity: 0.8;
}`,
    variables: {
      title: "Daily Word Challenge",
      subtitle: "Guess the hidden word",
      correctHint: "Letter is in the word and in the correct position",
      misplacedHint: "Letter is in the word but in the wrong position",
      wrongHint: "Letter is not in the word",
      wordGrid: `<div class="word-grid-row">
  <div class="letter-box correct">W</div>
  <div class="letter-box wrong">R</div>
  <div class="letter-box misplaced">I</div>
  <div class="letter-box wrong">T</div>
  <div class="letter-box correct">E</div>
</div>
<div class="word-grid-row">
  <div class="letter-box wrong">F</div>
  <div class="letter-box wrong">L</div>
  <div class="letter-box correct">A</div>
  <div class="letter-box misplaced">S</div>
  <div class="letter-box wrong">H</div>
</div>
<div class="word-grid-row">
  <div class="letter-box correct">S</div>
  <div class="letter-box correct">M</div>
  <div class="letter-box correct">A</div>
  <div class="letter-box correct">R</div>
  <div class="letter-box correct">T</div>
</div>`,
      brandingText: "Created with Quizzer"
    }
  },
  DARK_WORDLE: {
    name: "Dark Wordle",
    quizType: "WORDLE",
    html: `<div class="quiz-template">
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
    <div class="word-grid-container">
      {{wordGrid}}
    </div>
  </div>
  <div class="quiz-footer">
    <p class="branding">{{brandingText}}</p>
  </div>
</div>`,
    css: `.quiz-template {
  width: 100%;
  height: 100%;
  background: #121212;
  color: #e0e0e0;
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
  background: linear-gradient(135deg, #c0c0c0 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.25rem;
  margin-top: 0.75rem;
  color: #aaaaaa;
}

.instructions-legend {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  background: #1e1e1e;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  width: 100%;
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
  background-color: #22c55e;
}

.legend-box.misplaced {
  background-color: #eab308;
}

.legend-box.wrong {
  background-color: #64748b;
}

.legend-text {
  font-size: 0.9rem;
  color: #aaaaaa;
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
  gap: 0.75rem;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
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
  border-radius: 8px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  border: 2px solid #333333;
}

.letter-box.correct {
  background-color: #22c55e;
  color: white;
  border-color: #22c55e;
}

.letter-box.misplaced {
  background-color: #eab308;
  color: white;
  border-color: #eab308;
}

.letter-box.wrong {
  background-color: #64748b;
  color: white;
  border-color: #64748b;
}

.quiz-footer {
  text-align: center;
  margin-top: 2rem;
  padding: 1rem;
  color: #888888;
}

.branding {
  font-size: 0.875rem;
  opacity: 0.8;
}`,
    variables: {
      title: "Dark Word Challenge",
      subtitle: "Guess the hidden word",
      correctHint: "Letter is in the word and in the correct position",
      misplacedHint: "Letter is in the word but in the wrong position",
      wrongHint: "Letter is not in the word",
      wordGrid: `<div class="word-grid-row">
  <div class="letter-box correct">W</div>
  <div class="letter-box wrong">R</div>
  <div class="letter-box misplaced">I</div>
  <div class="letter-box wrong">T</div>
  <div class="letter-box correct">E</div>
</div>
<div class="word-grid-row">
  <div class="letter-box wrong">F</div>
  <div class="letter-box wrong">L</div>
  <div class="letter-box correct">A</div>
  <div class="letter-box misplaced">S</div>
  <div class="letter-box wrong">H</div>
</div>
<div class="word-grid-row">
  <div class="letter-box correct">S</div>
  <div class="letter-box correct">M</div>
  <div class="letter-box correct">A</div>
  <div class="letter-box correct">R</div>
  <div class="letter-box correct">T</div>
</div>`,
      brandingText: "Created with Quizzer"
    }
  },
  NUMBER_SEQUENCE: {
    name: "Modern Number Sequence",
    quizType: "NUMBER_SEQUENCE",
    html: `<div class="quiz-template">
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
</div>`,
    css: `.quiz-template {
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
}`,
    variables: {
      title: "Number Pattern Challenge",
      subtitle: "Find the missing number in the sequence",
      sequence: `<div class="number-box">2</div>
<div class="number-box">4</div>
<div class="number-box">8</div>
<div class="number-box">16</div>
<div class="number-box missing">?</div>`,
      brandingText: "Pattern Recognition"
    }
  },
  RHYME_TIME: {
    name: "Modern Rhyme Time",
    quizType: "RHYME_TIME",
    html: `<div class="quiz-template">
  <div class="quiz-header">
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </div>
  <div class="quiz-content">
    <div class="rhyme-container">
      {{rhymeGrid}}
    </div>
  </div>
  <div class="quiz-footer">
    <p class="branding">{{brandingText}}</p>
  </div>
</div>`,
    css: `.quiz-template {
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

.rhyme-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  background: #f8f8f8;
  border-radius: 16px;
  box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1);
  border: 2px solid #eee;
  width: 100%;
  max-width: 800px;
}

.rhyme-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #eee;
  transition: all 0.3s ease;
  text-align: center;
}

.rhyme-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.rhyme-card.missing {
  background: #f0f0f0;
  border: 2px dashed #ccc;
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
}`,
    variables: {
      title: "Rhyme Time Challenge",
      subtitle: "Find the missing rhyming word",
      rhymeGrid: `<div class="rhyme-card">
  <p class="rhyme-text">Cat</p>
</div>
<div class="rhyme-card">
  <p class="rhyme-text">Hat</p>
</div>
<div class="rhyme-card">
  <p class="rhyme-text">Dog</p>
</div>
<div class="rhyme-card missing">
  <p class="rhyme-text">???</p>
</div>`,
      brandingText: "Word Play"
    }
  },
  CONCEPT_CONNECTION: {
    name: "Modern Concept Connection",
    quizType: "CONCEPT_CONNECTION",
    html: `<div class="quiz-template">
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
</div>`,
    css: `.quiz-template {
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

.concepts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  background: #f8f8f8;
  border-radius: 16px;
  box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1);
  border: 2px solid #eee;
  width: 100%;
  max-width: 800px;
}

.concept-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #eee;
  transition: all 0.3s ease;
  text-align: center;
  cursor: pointer;
}

.concept-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
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
}`,
    variables: {
      title: "Connect the Concepts",
      subtitle: "Find the missing concept that connects them all",
      conceptsGrid: `<div class="concept-card">
  <p class="concept-text">Apple</p>
</div>
<div class="concept-card">
  <p class="concept-text">Banana</p>
</div>
<div class="concept-card">
  <p class="concept-text">Cherry</p>
</div>
<div class="concept-card">
  <p class="concept-text">Dragon Fruit</p>
</div>`,
      brandingText: "Mind Connections"
    }
  }
};

// Get templates by quiz type - for fallback and reference
function getTemplatesByType(quizType: string): Template[] {
  switch (quizType) {
    case 'WORDLE':
      return [defaultTemplates.WORDLE, defaultTemplates.DARK_WORDLE];
    case 'NUMBER_SEQUENCE':
      return [defaultTemplates.NUMBER_SEQUENCE];
    case 'RHYME_TIME':
      return [defaultTemplates.RHYME_TIME];
    case 'CONCEPT_CONNECTION':
      return [defaultTemplates.CONCEPT_CONNECTION];
    default:
      return [defaultTemplates.WORDLE, defaultTemplates.NUMBER_SEQUENCE, defaultTemplates.RHYME_TIME, defaultTemplates.CONCEPT_CONNECTION];
  }
}

// Helper to get a base template to use as a reference
function getBaseTemplate(quizType: string, prompt: string): Template {
  const templates = getTemplatesByType(quizType);
  const promptLower = prompt.toLowerCase();

  if (promptLower.includes('dark')) {
    return templates.find(t => t.name.toLowerCase().includes('dark')) || templates[0];
  } else {
    return templates[0];
  }
}

// Generate a template using OpenAI
async function generateAITemplate(prompt: string, quizType: string): Promise<Template> {
  // Get a base template to use as reference
  const baseTemplate = getBaseTemplate(quizType, prompt);

  try {
    // Create a system prompt that explains the task
    const systemPrompt = `You are an expert UI designer specializing in creating HTML/CSS templates for educational quizzes. 
Your task is to create a custom template based on user prompts, adhering to modern design principles.

The template should:
1. Be visually appealing and follow the user's style requests
2. Use semantic HTML
3. Include clean, maintainable CSS
4. Be responsive and accessible
5. Include placeholders using {{variable}} syntax for dynamic content

The template is for a ${quizType} quiz type.`;

    // Create a user prompt that includes:
    // 1. The design request
    // 2. The base template structure as a reference
    const userPrompt = `Please create a custom template based on this request: "${prompt}"

Reference the structure of this base template, but modify the styling significantly according to the request:

HTML Structure:
\`\`\`html
${baseTemplate.html}
\`\`\`

CSS Structure:
\`\`\`css
${baseTemplate.css}
\`\`\`

Variables used:
${Object.keys(baseTemplate.variables).map(key => `- {{${key}}}: ${typeof baseTemplate.variables[key] === 'string' && baseTemplate.variables[key].length < 50 ? baseTemplate.variables[key] : 'Complex content'}`).join('\n')}

Respond with a JSON object in this format:
{
  "html": "the full HTML template",
  "css": "the full CSS styling",
  "name": "An appropriate name for the template",
  "description": "A brief description of the template's style"
}`;

    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    // Parse the JSON response
    const aiResponse = JSON.parse(content);

    // Create the template
    const generatedTemplate: Template = {
      id: `temp_${Date.now()}`,
      name: aiResponse.name || `AI Generated ${quizType} Template`,
      description: aiResponse.description || `Custom template based on: "${prompt}"`,
      html: aiResponse.html || baseTemplate.html,
      css: aiResponse.css || baseTemplate.css,
      variables: baseTemplate.variables, // Keep the same variables for compatibility
      quizType: quizType
    };

    return generatedTemplate;
  } catch (error) {
    console.error('Error generating template with AI:', error);

    // Fallback to the rule-based method
    console.log('Falling back to rule-based template modification...');
    return modifyTemplate(baseTemplate, prompt);
  }
}

// Keep the rule-based modification as a fallback
function modifyTemplate(baseTemplate: Template, prompt: string): Template {
  // Create a copy of the template to modify
  const modifiedTemplate: Template = {
    ...baseTemplate,
    id: undefined, // Remove ID to create a new template
  };

  // Convert prompt to lowercase for easier matching
  const promptLower = prompt.toLowerCase();

  // Modify name based on prompt
  modifiedTemplate.name = `${promptLower.includes('dark') ? 'Dark' :
    promptLower.includes('light') ? 'Light' :
      promptLower.includes('gradient') ? 'Gradient' :
        promptLower.includes('modern') ? 'Modern' :
          promptLower.includes('minimal') ? 'Minimalist' :
            'Custom'} ${baseTemplate.name}`;

  // Modify description based on prompt elements
  modifiedTemplate.description = `${baseTemplate.description || ''} ${promptLower.includes('dark') ? 'with dark theme' :
    promptLower.includes('light') ? 'with light theme' :
      promptLower.includes('gradient') ? 'with gradient styling' :
        promptLower.includes('modern') ? 'with modern aesthetics' :
          promptLower.includes('minimal') ? 'with minimalist design' :
            'customized based on your request'
    }`;

  // Modify CSS based on keywords in the prompt
  let modifiedCss = baseTemplate.css;

  // Apply dark theme
  if (promptLower.includes('dark')) {
    modifiedCss = modifiedCss.replace(/background-color:\s*white/g, 'background-color: #121212')
      .replace(/background-color:\s*#ffffff/g, 'background-color: #121212')
      .replace(/color:\s*#1a1a1a/g, 'color: #e0e0e0')
      .replace(/color:\s*#333/g, 'color: #e0e0e0')
      .replace(/color:\s*#666/g, 'color: #aaaaaa')
      .replace(/color:\s*#777/g, 'color: #bbbbbb')
      .replace(/color:\s*#999/g, 'color: #888888');
  }

  // Apply light theme
  if (promptLower.includes('light') && !promptLower.includes('dark')) {
    modifiedCss = modifiedCss.replace(/background-color:\s*#[0-9a-f]{6}/g, 'background-color: #ffffff')
      .replace(/color:\s*#[0-9a-f]{6}/g, 'color: #333333');
  }

  // Apply gradient styling
  if (promptLower.includes('gradient')) {
    if (promptLower.includes('purple') || promptLower.includes('violet')) {
      modifiedCss = modifiedCss.replace(/background-color:\s*#ffffff/g,
        'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
        .replace(/background-color:\s*white/g,
          'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    } else if (promptLower.includes('blue')) {
      modifiedCss = modifiedCss.replace(/background-color:\s*#ffffff/g,
        'background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)')
        .replace(/background-color:\s*white/g,
          'background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)');
    } else if (promptLower.includes('green')) {
      modifiedCss = modifiedCss.replace(/background-color:\s*#ffffff/g,
        'background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)')
        .replace(/background-color:\s*white/g,
          'background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)');
    } else if (promptLower.includes('pink') || promptLower.includes('red')) {
      modifiedCss = modifiedCss.replace(/background-color:\s*#ffffff/g,
        'background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)')
        .replace(/background-color:\s*white/g,
          'background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)');
    } else {
      modifiedCss = modifiedCss.replace(/background-color:\s*#ffffff/g,
        'background: linear-gradient(135deg, #4a6cf7 0%, #24228b 100%)')
        .replace(/background-color:\s*white/g,
          'background: linear-gradient(135deg, #4a6cf7 0%, #24228b 100%)');
    }

    // Add text contrast for gradient backgrounds
    if (!promptLower.includes('dark')) {
      modifiedCss = modifiedCss.replace(/color:\s*#1a1a1a/g, 'color: #ffffff')
        .replace(/color:\s*#333/g, 'color: #ffffff')
        .replace(/color:\s*#666/g, 'color: #f0f0f0');
    }
  }

  // Apply rounded corners
  if (promptLower.includes('round')) {
    modifiedCss = modifiedCss.replace(/border-radius:\s*[0-9]+px;/g, 'border-radius: 16px;');

    // If specific elements need rounding
    if (baseTemplate.quizType === 'WORDLE') {
      modifiedCss = modifiedCss.replace(/border-radius:\s*4px/g, 'border-radius: 12px');
    } else if (promptLower.includes('pill') || promptLower.includes('oval')) {
      modifiedCss = modifiedCss.replace(/border-radius:\s*[0-9]+px/g, 'border-radius: 9999px');
    }
  }

  // Apply shadows
  if (promptLower.includes('shadow') || promptLower.includes('3d')) {
    // Add subtle shadow to elements
    modifiedCss = modifiedCss.replace(/box-shadow:[^;]+;/g, 'box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);');

    // Add shadow to container if it doesn't have one
    if (!modifiedCss.includes('box-shadow')) {
      modifiedCss = modifiedCss.replace(/.quiz-template\s*{[^}]+}/, (match) => {
        return match.replace('}', '  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);\n}');
      });
    }
  }

  // Apply font changes
  if (promptLower.includes('serif')) {
    modifiedCss = modifiedCss.replace(/font-family:[^;]+;/g, 'font-family: Georgia, "Times New Roman", serif;');
  } else if (promptLower.includes('sans') || promptLower.includes('modern')) {
    modifiedCss = modifiedCss.replace(/font-family:[^;]+;/g, 'font-family: "Inter", system-ui, sans-serif;');
  } else if (promptLower.includes('playful') || promptLower.includes('fun')) {
    modifiedCss = modifiedCss.replace(/font-family:[^;]+;/g, 'font-family: "Comic Sans MS", "Comic Sans", cursive;');
  }

  // Apply minimalist styling
  if (promptLower.includes('minimal') || promptLower.includes('minimalist')) {
    // Simplify colors
    modifiedCss = modifiedCss.replace(/background-color:\s*#[0-9a-f]{6}/g, 'background-color: #ffffff');
    modifiedCss = modifiedCss.replace(/color:\s*#[0-9a-f]{6}/g, 'color: #333333');

    // Reduce shadows
    modifiedCss = modifiedCss.replace(/box-shadow:[^;]+;/g, 'box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);');

    // Reduce border width
    modifiedCss = modifiedCss.replace(/border:\s*[0-9]+px/g, 'border: 1px');

    // Simplify gradients
    modifiedCss = modifiedCss.replace(/background:\s*linear-gradient[^;]+;/g, 'background-color: #f5f5f5;');
  }

  // Apply the modified CSS
  modifiedTemplate.css = modifiedCss;

  return modifiedTemplate;
}

// POST handler for template generation
export async function POST(request: Request) {
  try {
    let body;
    // Handle empty or null body
    try {
      body = await request.json();
      if (!body) {
        return NextResponse.json({
          success: false,
          error: {
            message: "Request body is empty",
            code: "VALIDATION_ERROR"
          }
        }, { status: 400 });
      }
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json({
        success: false,
        error: {
          message: "Invalid JSON in request body",
          code: "VALIDATION_ERROR"
        }
      }, { status: 400 });
    }

    // Validate the request body
    const { prompt, quizType } = body;

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: {
          message: "Prompt is required",
          code: "VALIDATION_ERROR"
        }
      }, { status: 400 });
    }

    if (!quizType) {
      return NextResponse.json({
        success: false,
        error: {
          message: "Quiz type is required",
          code: "VALIDATION_ERROR"
        }
      }, { status: 400 });
    }

    // Get a template by the quiz type
    const templates = getTemplatesByType(quizType as QuizType);
    if (!templates || templates.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          message: `No templates found for quiz type: ${quizType}`,
          code: "NOT_FOUND"
        }
      }, { status: 404 });
    }

    // For now, just return the first template of the specified type
    const template = templates[0];

    return NextResponse.json({
      ...template,
      name: `${prompt.slice(0, 30)}...`,
      description: `AI generated template based on: ${prompt}`
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error occurred",
        code: "SERVER_ERROR"
      }
    }, { status: 500 });
  }
} 
# Service Adapters

This directory contains adapter classes that connect different parts of the application to centralized services.

## SmartGeneratorAdapter

The `SmartGeneratorAdapter` integrates the Smart Quiz Generator with the centralized `QuizGenerationService`. This ensures that all quiz content is generated using the same underlying system, regardless of whether it's created individually or in bulk.

### Key Benefits

- **Consistent Content Generation**: Ensures the same high-quality content for both individual and bulk quiz creation
- **Centralized Logic**: All quiz generation logic is maintained in one place
- **Easier Maintenance**: Updates to the quiz generation system automatically apply to both the regular quiz creator and Smart Generator

### How It Works

1. The Smart Generator API endpoint uses the adapter instead of calling OpenAI directly
2. The adapter translates the Smart Generator's parameters to the format expected by the centralized service
3. The centralized service generates the quiz content using the appropriate strategy for each quiz type
4. The adapter returns the generated content in a format that the Smart Generator can use

### Example Usage

```typescript
// Create an instance of the adapter
const adapter = new SmartGeneratorAdapter();

// Generate quiz content
const quizContent = await adapter.generateQuizContent({
  templateType: QuizType.WORDLE,
  theme: "Space Exploration",
  difficulty: "medium",
  language: "en",
  templateId: "template-123"
});

// Use the generated content
console.log(quizContent.title); // "Space Exploration Word Challenge"
console.log(quizContent.answer); // "ORBIT"
```

## Migration from BulkQuizGenerationService

The `BulkQuizGenerationService` has been deprecated in favor of using the `SmartGeneratorAdapter` with the centralized `QuizGenerationService`. This change ensures consistent quiz generation across the application. 
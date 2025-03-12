"use client";

import { GenerationProgress } from "@/components/quiz/GenerationProgress";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useQuizForm } from "@/hooks/useQuizForm";
import { QUIZ_TYPE_DISPLAY, getAnswerPlaceholder } from "@/lib/quiz-types";
import { LANGUAGES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, RotateCcw, Save, Sparkles } from "lucide-react";

export default function NewQuizPage() {
  const {
    form,
    isSubmitting,
    isGenerating,
    previewHtml,
    generationProgress,
    completedFields,
    currentField,
    selectedTemplate,
    templates,
    handleGenerateContent,
    handleSubmit,
  } = useQuizForm();

  const handleReset = () => {
    form.reset();
  };

  const isGeneratingContent = Object.values(isGenerating).some(Boolean);
  const hasFormChanges = Object.keys(form.formState.dirtyFields).length > 0;

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Create New Quiz</h1>
          <p className="text-muted-foreground mt-2">
            Design your quiz by selecting a template and filling in the details.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasFormChanges || isGeneratingContent || isSubmitting}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateContent}
            disabled={isGeneratingContent || isSubmitting}
            className="gap-2"
          >
            {isGenerating.all ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {generationProgress > 0 ? `${Math.round(generationProgress)}%` : 'Generating...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate All
              </>
            )}
          </Button>
          <Button
            type="submit"
            disabled={isGeneratingContent || isSubmitting}
            onClick={form.handleSubmit(handleSubmit)}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Create Quiz
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Section */}
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className={cn(
              "space-y-6",
              (isGeneratingContent || isSubmitting) && "opacity-70 pointer-events-none"
            )}>
              {/* Quiz Template Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Quiz Template</CardTitle>
                  <CardDescription>Choose a template for your quiz</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template) => {
                              const display = QUIZ_TYPE_DISPLAY[template.quizType];
                              return (
                                <SelectItem key={template.id} value={template.id}>
                                  <div className="flex items-center gap-2">
                                    {display?.icon && <display.icon className="w-4 h-4" />}
                                    <span>{template.name}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {display?.label || template.quizType.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {selectedTemplate && (
                <>
                  {/* Quiz Content */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Quiz Content</CardTitle>
                      <CardDescription>Enter the details for your quiz</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(LANGUAGES).map(([code, name]) => (
                                  <SelectItem key={code} value={code}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="space-y-4">
                        {Object.entries(selectedTemplate.variables).map(([key, defaultValue], index) => (
                          <FormField
                            key={`${key}-${index}`}
                            control={form.control}
                            name={`variables.${key}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </FormLabel>
                                <FormControl>
                                  {key === 'question' ? (
                                    <Textarea
                                      placeholder={`Enter ${key}`}
                                      className="min-h-[100px] resize-y"
                                      {...field}
                                      value={typeof field.value === 'string' ? field.value : (typeof defaultValue === 'string' ? defaultValue : '')}
                                    />
                                  ) : (
                                    <Input
                                      placeholder={`Enter ${key}`}
                                      {...field}
                                      value={typeof field.value === 'string' ? field.value : (typeof defaultValue === 'string' ? defaultValue : '')}
                                    />
                                  )}
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Admin Section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Admin Information</CardTitle>
                      <CardDescription>Additional information for quiz management</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="answer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Answer
                              <span className="text-xs text-muted-foreground">(Not shown in quiz)</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                readOnly={true}
                                className="bg-muted"
                                placeholder={getAnswerPlaceholder(selectedTemplate.quizType)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="solution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Solution
                              <span className="text-xs text-muted-foreground">(Explain how to solve)</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-[100px] resize-y"
                                placeholder="Explain how to solve this quiz..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </form>
          </Form>

          {isGeneratingContent && (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Content
                </CardTitle>
                <CardDescription>Please wait while we generate your quiz content</CardDescription>
              </CardHeader>
              <CardContent>
                <GenerationProgress
                  progress={generationProgress}
                  currentField={currentField}
                  completedFields={completedFields}
                  getFieldValue={(field) => {
                    const value = form.getValues(`variables.${field}`);
                    return typeof value === 'string' ? value : '';
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                Preview how your quiz will look on Facebook
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="relative">
                  <div
                    id="quiz-preview"
                    className="preview-container w-full aspect-square bg-white rounded-lg overflow-hidden shadow-lg relative"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-card p-1 rounded-tl-md shadow-sm border text-xs text-muted-foreground">
                    1080 × 1080
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    Select a template to see the preview
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Card className={cn(
              isGeneratingContent && "opacity-60 pointer-events-none"
            )}>
              <CardHeader className="pb-3">
                <CardTitle>Template Details</CardTitle>
                <CardDescription>Information about the selected template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Type:</span>
                  <span className="ml-2 text-muted-foreground">
                    {QUIZ_TYPE_DISPLAY[selectedTemplate.quizType]?.label ||
                      selectedTemplate.quizType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Required Fields:</span>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {Object.keys(selectedTemplate.variables).map((key) => (
                      <span key={key} className="inline-block bg-secondary rounded-md px-2 py-1 mr-2 mb-2">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
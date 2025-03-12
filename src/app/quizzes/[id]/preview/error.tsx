"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Quiz preview error:", error);
  }, [error]);

  return (
    <div className="container">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Failed to load quiz preview</CardTitle>
          <CardDescription>
            There was an error loading the quiz preview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "Please try again or contact support if the problem persists."}
          </p>
          <div className="flex gap-4">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" onClick={() => window.location.href = "/quizzes"}>
              Go back to quizzes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
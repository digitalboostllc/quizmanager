import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Smart Generator | FB Quiz",
    description: "Generate and schedule multiple quizzes with AI assistance",
};

export default function SmartGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            {children}
        </div>
    );
} 
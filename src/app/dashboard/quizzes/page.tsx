"use client";

import { QuizzesPage } from '@/components/pages/quizzes/QuizzesPage';
import { useEffect, useState } from 'react';

export default function DashboardQuizzesPage() {
    console.log("🏁 Dashboard Quizzes Page component rendering");
    const [mounted, setMounted] = useState(false);

    // Add enhanced logging for debugging
    useEffect(() => {
        console.log("🚀 Dashboard Quizzes Page mounted");
        setMounted(true);

        // Test fetch API directly to check connectivity
        const testEndpoint = async () => {
            try {
                console.log("🔍 Testing API connectivity...");
                const response = await fetch('/api/quizzes?limit=1&_t=' + Date.now(), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });

                console.log(`✅ API Test Response status: ${response.status}`);

                if (response.ok) {
                    try {
                        const data = await response.json();
                        console.log("✅ API Test Response data:", data);

                        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
                            console.log("✅ Sample quiz data:", data.data[0]);
                        } else {
                            console.log("⚠️ API returned empty data array or unexpected format", data);
                        }
                    } catch (parseError) {
                        console.error("❌ Error parsing API response:", parseError);
                        const text = await response.text();
                        console.error("❌ API Raw Response:", text);
                    }
                } else {
                    try {
                        const text = await response.text();
                        console.error("❌ API Test Error response:", text);
                    } catch (textError) {
                        console.error("❌ Could not get error response text:", textError);
                    }
                }
            } catch (error) {
                console.error("❌ API Test Error:", error);
            }
        };

        testEndpoint();

        return () => {
            console.log("🛑 Dashboard Quizzes Page unmounted");
        };
    }, []);

    console.log("🔄 Dashboard Quizzes Page rendering, mounted=", mounted);

    return (
        <>
            {mounted ? (
                <QuizzesPage />
            ) : (
                <div className="p-8 text-center">
                    <p className="text-muted-foreground">Loading quizzes...</p>
                </div>
            )}
        </>
    );
} 
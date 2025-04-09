export const runtime = 'nodejs';

import { auth } from '@/lib/auth';
import openai from '@/lib/openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // Get the current user
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Parse the request
        const { prompt, max_tokens = 150, temperature = 0.7, stream = false } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // If streaming is requested, use streaming response
        if (stream) {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                stream: true,
                messages: [{ role: 'user', content: prompt }],
                max_tokens,
                temperature,
            });

            const stream = OpenAIStream(response);
            return new StreamingTextResponse(stream);
        }

        // Otherwise, use standard response
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens,
            temperature,
        });

        const content = response.choices[0]?.message?.content?.trim() || '';

        return NextResponse.json({ content });
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        return NextResponse.json(
            { error: 'Failed to generate content' },
            { status: 500 }
        );
    }
} 
import { NextRequest, NextResponse } from 'next/server';
import { handleWebsiteAssistantRequest } from '@/lib/chat/website-assistant';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await handleWebsiteAssistantRequest(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        answer:
          'I can help with ShipStack generation, blueprints, previews, saved projects, and account settings.',
        outOfScope: false,
        followUpSuggestions: [
          'How does project generation work?',
          'How do I edit a blueprint?',
          'Where are my saved projects?',
        ],
        provider: 'fallback',
      },
      { status: 200 }
    );
  }
}

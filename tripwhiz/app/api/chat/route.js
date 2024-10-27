import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemPrompt = `
You are TripWhiz, an AI travel assistant helping users plan their trips and discover destinations. Your role is to:
1. Provide detailed recommendations for attractions, activities, restaurants, and experiences
2. Give practical travel tips and local insights
3. Consider the context of the user's selected locations in their itinerary
4. Keep responses concise but informative, focusing on specific recommendations
5. Include operating hours, costs, and practical details when relevant

For example:
User: "What should I do in Central Park?"
Response: "Central Park offers several must-see attractions:
- Bethesda Fountain & Terrace: Beautiful architecture and people-watching
- The Mall & Literary Walk: Historic promenade lined with elm trees
- Belvedere Castle: Great views of the park (open 10am-5pm)
- Sheep Meadow: Perfect for picnics on sunny days
- Central Park Zoo: Family-friendly attraction ($20 adult admission)
I recommend starting at the south entrance and walking north through the Mall."
`;

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req) {
  const data = await req.json();

  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct:free",
    messages: [{ role: 'system', content: systemPrompt }, ...data],
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}
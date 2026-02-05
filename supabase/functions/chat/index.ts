import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to send SSE events
function sendSSE(controller: ReadableStreamDefaultController, event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

// Types for function calling
interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

interface Message {
  role: string;
  content: string;
}

// Initialize clients
const getClients = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

  return { supabase, genAI, geminiApiKey };
};

// System prompt for EduAssist
const SYSTEM_PROMPT = `You are EduAssist, an AI assistant designed to help educators create high-quality learning materials.

Your purpose:
- Help educators search through educational resources
- Identify common student misconceptions proactively
- Generate well-structured, measurable learning objectives following Bloom's Taxonomy
- Create complete learning paths and curriculum sequences
- Create evidence-based educational content grounded in the knowledge base
- Save generated materials for later use

CRITICAL WORKFLOWS:

1. For Learning Objectives:
   a. FIRST, call search_knowledge_base() to find relevant content
   b. OPTIONALLY, call identify_common_misconceptions() to understand typical student errors
   c. THEN, call generate_learning_objectives() with the topic AND retrieved context
   d. Present objectives with source citations and misconception warnings

2. For Learning Paths / Curriculum:
   a. FIRST, call search_knowledge_base() for topic content
   b. THEN, call generate_learning_path() to create a sequenced curriculum
   c. OPTIONALLY, call identify_common_misconceptions() for key concepts in the path

3. For Proactive Teaching:
   - When users ask about teaching a topic, proactively call identify_common_misconceptions()
   - This helps educators prepare for typical student confusion BEFORE it happens

Guidelines:
1. When users ask what you can help with or what's available, call list_available_topics()
2. ALWAYS search the knowledge base BEFORE generating content - pass search results as context
3. Be proactive: suggest misconception analysis when planning lessons
4. Ground your responses in retrieved evidence - cite sources
5. Use educational best practices (Bloom's Taxonomy, measurable outcomes, prerequisite sequencing)
6. Be clear, concise, and actionable

Available functions:
- list_available_topics: Show what documents are in the knowledge base
- search_knowledge_base(query, top_k): Find relevant content - USE THIS FIRST
- identify_common_misconceptions(topic, student_level): Identify typical student errors and confusion points - USE PROACTIVELY
- generate_learning_objectives(topic, context, count, level): Generate individual objectives based on context
- generate_learning_path(topic, context, start_level, end_level, duration, objective_count): Create complete sequenced curriculum
- save_content(title, content, metadata): Store generated materials

IMPORTANT:
- Always search knowledge base first to get context
- Be proactive about misconception analysis - good teachers anticipate confusion
- For comprehensive curriculum planning, use generate_learning_path instead of just generate_learning_objectives

CRITICAL - Handling Multiple Topics:
- When the user asks about MULTIPLE topics in a SINGLE query (e.g., "What are misconceptions about A, B, and C?"), DO NOT call the same function multiple times
- Instead, combine ALL topics into ONE function call by passing them together in the topic parameter
- Example: If user asks "What are misconceptions about informed consent, research ethics, and governance?", call identify_common_misconceptions ONCE with topic="informed consent, research ethics protocols, and research governance frameworks"
- This applies to ALL functions: identify_common_misconceptions, generate_learning_objectives, generate_learning_path, etc.
- Only make MULTIPLE function calls if the user explicitly asks for separate, distinct analyses or if the topics are unrelated

Remember: Quality over quantity. Every learning objective should be specific, measurable, and pedagogically sound.`;

// Function definitions for Gemini
const functions = [
  {
    name: "list_available_topics",
    description: "Lists all available documents and topics in the knowledge base. Use this to show users what content is available or to suggest topics they can explore.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "search_knowledge_base",
    description: "Searches the educational knowledge base using semantic search. Use this when you need to find relevant information from the document collection to answer questions or generate content.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant content in the knowledge base"
        },
        top_k: {
          type: "number",
          description: "Number of most relevant results to return (default: 5, max: 10)",
          default: 5
        }
      },
      required: ["query"]
    }
  },
  {
    name: "generate_learning_objectives",
    description: "Generates educational learning objectives based on a topic and provided context from the knowledge base. IMPORTANT: You must call search_knowledge_base FIRST to get relevant context, then pass that context here. Creates well-structured, measurable learning objectives following Bloom's taxonomy.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The topic or subject for which to generate learning objectives"
        },
        context: {
          type: "string",
          description: "Context from search_knowledge_base results - include relevant passages from the knowledge base to ground the objectives"
        },
        count: {
          type: "number",
          description: "Number of learning objectives to generate (default: 3)",
          default: 3
        },
        level: {
          type: "string",
          description: "Educational level: elementary, middle_school, high_school, university, or professional",
          default: "university"
        }
      },
      required: ["topic", "context"]
    }
  },
  {
    name: "save_content",
    description: "Saves generated educational content to the database for later retrieval. Use this when the user explicitly asks to save or store content.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "A descriptive title for the content being saved"
        },
        content: {
          type: "string",
          description: "The actual content to save (can be markdown formatted)"
        },
        metadata: {
          type: "object",
          description: "Additional metadata like topic, level, source_query, etc.",
          properties: {
            topic: { type: "string" },
            content_type: { type: "string" },
            level: { type: "string" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "identify_common_misconceptions",
    description: "Identifies common student misconceptions and errors for one or more topics by searching the knowledge base. Use this proactively BEFORE generating learning objectives to help educators anticipate and address typical student confusion points. IMPORTANT: If the user asks about multiple related topics in one query, combine them into a single call by listing all topics together.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The topic or concept(s) to analyze for common misconceptions. Can include multiple topics if user asks about several at once (e.g., 'informed consent, research ethics protocols, and governance frameworks'). List all topics together separated by commas."
        },
        student_level: {
          type: "string",
          description: "Educational level: elementary, middle_school, high_school, university, or professional",
          default: "university"
        }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_learning_path",
    description: "Creates a complete, sequenced learning path (curriculum) for a topic, spanning multiple learning objectives ordered by prerequisite knowledge. Use this when users want a comprehensive curriculum or course outline rather than just isolated objectives. IMPORTANT: If the user asks about multiple related topics, combine them into ONE learning path showing how they connect.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The main topic or subject for the learning path. Can include multiple related topics if user wants an integrated curriculum covering several areas."
        },
        context: {
          type: "string",
          description: "Context from search_knowledge_base results to ground the learning path"
        },
        start_level: {
          type: "string",
          description: "Starting educational level: beginner, intermediate, or advanced",
          default: "beginner"
        },
        end_level: {
          type: "string",
          description: "Target educational level: beginner, intermediate, or advanced",
          default: "intermediate"
        },
        duration: {
          type: "string",
          description: "Timeframe: one_week, one_month, one_semester, or one_year",
          default: "one_month"
        },
        objective_count: {
          type: "number",
          description: "Number of learning objectives in the path (default: 5)",
          default: 5
        }
      },
      required: ["topic", "context"]
    }
  }
];

// Function implementations
async function listAvailableTopics(supabase: any): Promise<any> {
  try {
    // Get all unique documents with their titles and metadata
    const { data, error } = await supabase
      .from('documents')
      .select('source_file, title, metadata')
      .order('source_file');

    if (error) {
      console.error('Error listing topics:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Group by source file
    const topicMap = new Map();
    data.forEach((doc: any) => {
      if (!topicMap.has(doc.source_file)) {
        topicMap.set(doc.source_file, {
          source: doc.source_file,
          title: doc.title,
          sample_content: []
        });
      }
    });

    const topics = Array.from(topicMap.values());

    return {
      success: true,
      topics_count: topics.length,
      topics: topics.slice(0, 15), // Limit to prevent huge response
      message: `Found ${topics.length} documents in the knowledge base. Topics include crisis support resources, consent education, social programs, and educational frameworks.`
    };
  } catch (error) {
    console.error('Error in listAvailableTopics:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function searchKnowledgeBase(
  supabase: any,
  genAI: any,
  query: string,
  topK: number = 5,
  apiKey: string
): Promise<any> {
  try {
    // Generate embedding using official Google API format
    const embeddingUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';
    const embeddingResponse = await fetch(embeddingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: query }] },
        outputDimensionality: 768
      })
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Embedding API error: ${await embeddingResponse.text()}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.embedding.values;

    // Search for similar documents
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: Math.min(topK, 10)
    });

    if (error) {
      console.error('Error searching documents:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }

    // Format results
    const results = data.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      source: doc.source_file,
      chunk_index: doc.chunk_index,
      similarity: doc.similarity,
      metadata: doc.metadata
    }));

    return {
      success: true,
      query,
      results_count: results.length,
      results
    };
  } catch (error) {
    console.error('Error in searchKnowledgeBase:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

async function generateLearningObjectives(
  genAI: any,
  topic: string,
  context: string = "",
  count: number = 3,
  level: string = "university"
): Promise<any> {
  try {
    // Build prompt for generating learning objectives
    const prompt = `You are an expert educator. Generate ${count} clear, measurable learning objectives for the topic: "${topic}"

${context ? `Use this context from the knowledge base to inform your objectives:\n\n${context}\n\n` : ''}Education Level: ${level}

Requirements:
- Use action verbs from Bloom's Taxonomy (e.g., analyze, evaluate, create, apply, understand, remember)
- Make each objective specific and measurable
- Appropriate for ${level} level students
- Ground objectives in the provided context if available

Format: Return ONLY the numbered list of objectives, nothing else.`;

    // Call Gemini to generate the objectives
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const objectivesText = response.text || "";

    return {
      success: true,
      topic,
      level,
      count,
      objectives: objectivesText,
      had_context: !!context
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function saveContent(
  supabase: any,
  title: string,
  content: string,
  metadata: Record<string, any> = {}
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('saved_content')
      .insert({
        title,
        content,
        metadata,
        content_type: metadata.content_type || 'general',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving content:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      message: `Content "${title}" has been saved successfully.`,
      saved_id: data.id,
      created_at: data.created_at
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function identifyCommonMisconceptions(
  genAI: any,
  supabase: any,
  topic: string,
  studentLevel: string = "university",
  apiKey: string
): Promise<any> {
  try {
    // First, search knowledge base for content about common errors and misconceptions
    const searchQuery = `common misconceptions errors mistakes misunderstandings students ${topic}`;
    const searchResults = await searchKnowledgeBase(supabase, genAI, searchQuery, 5, apiKey);

    const context = searchResults.success && searchResults.results.length > 0
      ? searchResults.results.map((r: any) => r.content).join('\n\n')
      : '';

    // Generate misconception analysis using Gemini
    const prompt = `You are an expert educator analyzing common student misconceptions.

Topic: "${topic}"
Student Level: ${studentLevel}

${context ? `Use this context from the knowledge base about common errors:\n\n${context}\n\n` : ''}

Identify 3-5 common misconceptions or errors that students typically have when learning about ${topic}.

For each misconception:
1. State the misconception clearly
2. Explain why students develop this misunderstanding
3. Suggest a teaching strategy to address it proactively

Format as a numbered list with this structure:
1. **Misconception:** [clear statement]
   **Why it happens:** [explanation]
   **Teaching strategy:** [how to prevent/correct it]`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const misconceptionsText = response.text || "";

    return {
      success: true,
      topic,
      student_level: studentLevel,
      misconceptions: misconceptionsText,
      had_context: !!context,
      sources_used: searchResults.results_count || 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function generateLearningPath(
  genAI: any,
  topic: string,
  context: string = "",
  startLevel: string = "beginner",
  endLevel: string = "intermediate",
  duration: string = "one_month",
  objectiveCount: number = 5
): Promise<any> {
  try {
    // Generate sequenced learning path
    const prompt = `You are an expert curriculum designer creating a complete learning path.

Topic: "${topic}"
Starting Level: ${startLevel}
Target Level: ${endLevel}
Duration: ${duration}
Number of Objectives: ${objectiveCount}

${context ? `Use this context from the knowledge base:\n\n${context}\n\n` : ''}

Create a sequenced learning path with ${objectiveCount} learning objectives that progress from ${startLevel} to ${endLevel} level.

Requirements:
- Order objectives by prerequisite knowledge (foundational concepts first)
- Each objective should build on previous ones
- Use Bloom's Taxonomy action verbs appropriate for progression
- Make objectives specific, measurable, and achievable
- Consider the ${duration} timeframe

Format as a numbered list with this structure:
1. [Objective 1 - Foundation] (Week 1)
   **Prerequisite:** None
   **Builds toward:** [next skill]

2. [Objective 2] (Week 2)
   **Prerequisite:** [previous objective]
   **Builds toward:** [next skill]

... and so on.

Return ONLY the learning path, nothing else.`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const learningPathText = response.text || "";

    return {
      success: true,
      topic,
      start_level: startLevel,
      end_level: endLevel,
      duration,
      objective_count: objectiveCount,
      learning_path: learningPathText,
      had_context: !!context
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute a function call
async function executeFunctionCall(
  functionCall: FunctionCall,
  supabase: any,
  genAI: any,
  apiKey: string
): Promise<any> {
  const { name, args } = functionCall;

  console.log(`Executing function: ${name}`, args);

  switch (name) {
    case "list_available_topics":
      return await listAvailableTopics(supabase);

    case "search_knowledge_base":
      return await searchKnowledgeBase(
        supabase,
        genAI,
        args.query,
        args.top_k || 5,
        apiKey
      );

    case "generate_learning_objectives":
      return await generateLearningObjectives(
        genAI,
        args.topic,
        args.context || "",
        args.count || 3,
        args.level || "university"
      );

    case "save_content":
      return await saveContent(
        supabase,
        args.title,
        args.content,
        args.metadata || {}
      );

    case "identify_common_misconceptions":
      return await identifyCommonMisconceptions(
        genAI,
        supabase,
        args.topic,
        args.student_level || "university",
        apiKey
      );

    case "generate_learning_path":
      return await generateLearningPath(
        genAI,
        args.topic,
        args.context || "",
        args.start_level || "beginner",
        args.end_level || "intermediate",
        args.duration || "one_month",
        args.objective_count || 5
      );

    default:
      return {
        success: false,
        error: `Unknown function: ${name}`
      };
  }
}

// STREAMING SERVE HANDLER WITH SSE
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const { supabase, genAI, geminiApiKey } = getClients();

    // Create SSE streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          sendSSE(controller, 'status', { stage: 'analyzing', message: 'Analyzing your request...' });

          // Build conversation history
          let history: any[] = [];
          for (const msg of messages.slice(0, -1)) {
            const role = msg.role === 'user' ? 'user' : 'model';
            history.push({
              role,
              parts: [{ text: msg.content }]
            });
          }

          // Skip initial assistant message if it's first
          if (history.length > 0 && history[0].role === 'model') {
            history = history.slice(1);
          }

          // Build contents array
          const latestMessage = messages[messages.length - 1].content;
          const contents = [...history, { role: 'user', parts: [{ text: latestMessage }] }];

          const functionCalls: Array<{ call: FunctionCall; result: any }> = [];

          // Function calling loop
          let currentContents = [...contents];
          while (true) {
            const response = await genAI.models.generateContent({
              model: "gemini-2.5-flash",
              contents: currentContents,
              config: {
                systemInstruction: SYSTEM_PROMPT,
                tools: [{ functionDeclarations: functions }]
              }
            });

            const candidate = response.candidates?.[0];
            if (!candidate?.content?.parts) {
              console.error('No candidate or parts in response');
              break;
            }

            const parts = candidate.content.parts;
            const functionCallParts = parts.filter(p => p.functionCall);

            if (functionCallParts.length === 0) {
              // No function calls - stream final response
              sendSSE(controller, 'status', { stage: 'generating', message: 'Generating response...' });

              const text = parts.filter(p => p.text).map(p => p.text).join('');

              // Stream text word by word
              const words = text.split(' ');
              for (let i = 0; i < words.length; i++) {
                const word = words[i] + (i < words.length - 1 ? ' ' : '');
                sendSSE(controller, 'content', { text: word });
              }

              // Send completion
              sendSSE(controller, 'done', {
                parts: parts,
                function_calls: functionCalls.map(fc => ({
                  name: fc.call.name,
                  args: fc.call.args,
                  result: fc.result
                }))
              });

              controller.close();
              return;
            }

            // Execute function call
            const functionCall = functionCallParts[0].functionCall;

            // Map function names to status messages
            const statusMap: Record<string, { stage: string; message: string }> = {
              'search_knowledge_base': { stage: 'searching', message: 'Searching knowledge base...' },
              'identify_common_misconceptions': { stage: 'analyzing', message: 'Analyzing misconceptions...' },
              'generate_learning_objectives': { stage: 'generating', message: 'Generating learning objectives...' },
              'generate_learning_path': { stage: 'generating', message: 'Creating learning path...' },
              'list_available_topics': { stage: 'retrieving', message: 'Listing available topics...' },
              'save_content': { stage: 'saving', message: 'Saving content...' }
            };

            const status = statusMap[functionCall.name] || { stage: 'processing', message: 'Processing...' };
            sendSSE(controller, 'status', status);

            // Send function start event
            sendSSE(controller, 'function_start', {
              name: functionCall.name,
              args: functionCall.args
            });

            const functionResult = await executeFunctionCall(functionCall, supabase, genAI, geminiApiKey);

            // Send function complete event
            sendSSE(controller, 'function_complete', {
              name: functionCall.name,
              result: functionResult
            });

            functionCalls.push({ call: functionCall, result: functionResult });

            // Add to contents for next iteration
            currentContents.push({ role: 'model', parts: parts });
            currentContents.push({
              role: 'user',
              parts: [{ functionResponse: { name: functionCall.name, response: functionResult } }]
            });
          }

          // Fallback close
          sendSSE(controller, 'error', { message: 'No response generated' });
          controller.close();

        } catch (error) {
          console.error('Stream error:', error);
          sendSSE(controller, 'error', { message: error.message });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

import { GoogleGenAI, Type } from "@google/genai";
import { Note, GraphLink, Task, Subtask } from '../types';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const performWebSearch = async (query: string): Promise<{ text: string, sources: any[] }> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "No results found.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources };

  } catch (error) {
    console.error(error);
    return { text: "Unable to perform search at this moment.", sources: [] };
  }
};

export const generateNoteTags = async (noteContent: string): Promise<string[]> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    
    if (!noteContent || noteContent.trim().length < 10) return [];

    const response = await ai.models.generateContent({
      model,
      contents: `Analyze the following note content and produce a list of 3 to 5 relevant tags.
      
      Requirements:
      - Tags must be single words or short hyphenated-phrases.
      - All lowercase.
      - No hash (#) symbols.
      - Strictly relevant to the main topics.
      - Return ONLY the array of strings.
      
      Note Content:
      "${noteContent.substring(0, 4000)}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const semanticGraphOrganization = async (notes: Note[]): Promise<{ links: { source: string, target: string, value: number }[] }> => {
  try {
    const ai = getAI();
    const model = 'gemini-3-pro-preview';

    const notesSummary = notes.map(n => ({
      id: n.id,
      title: n.title,
      excerpt: n.blocks.find(b => b.type === 'paragraph' || b.type === 'heading')?.content.substring(0, 100) || ''
    }));

    const prompt = `
      Analyze the following list of notes. Identify semantic relationships between them based on their titles and excerpts.
      Return a list of links representing these connections.
      
      Notes:
      ${JSON.stringify(notesSummary, null, 2)}
      
      Requirements:
      - Create links where topics overlap or are conceptually related.
      - "value" should be between 0.1 (weak) and 1.0 (strong).
      - Do not link a note to itself.
      - Return pure JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { links: [] };

  } catch (error) {
    console.error(error);
    return { links: [] };
  }
};

export const prioritizeTasks = async (tasks: Task[]): Promise<Task[]> => {
  try {
    if (tasks.length === 0) return [];
    
    const ai = getAI();
    const model = 'gemini-2.5-flash';

    const tasksSimple = tasks.map(t => ({ 
      id: t.id, 
      content: t.content, 
      priority: t.priority,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null
    }));

    const prompt = `
      Analyze tasks to identify the top 3 items requiring immediate focus.
      
      Logic:
      1. Deadlines (dueDate) close to today are critical.
      2. Active verbs (Finish, Call, Submit) imply urgency.
      3. Learning/Passive verbs (Read, Watch) are usually backlog (normal).
      4. DO NOT use emojis or graphical markers in the response.
      
      Return JSON:
      [{ "id": "task-id", "priority": "high" | "normal" }]
      
      Tasks:
      ${JSON.stringify(tasksSimple)}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['high', 'normal'] }
            }
          }
        }
      }
    });

    if (response.text) {
        const sortedData = JSON.parse(response.text) as { id: string, priority: 'high' | 'normal' }[];
        
        const reorderedTasks: Task[] = [];
        const taskMap = new Map(tasks.map(t => [t.id, t]));

        sortedData.forEach(item => {
            const original = taskMap.get(item.id);
            if (original) {
                reorderedTasks.push({ ...original, priority: item.priority });
                taskMap.delete(item.id);
            }
        });

        taskMap.forEach(t => reorderedTasks.push(t));

        return reorderedTasks;
    }
    return tasks;

  } catch (error) {
    console.error(error);
    return tasks;
  }
};

export const breakDownTask = async (taskContent: string): Promise<Subtask[]> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';

    const prompt = `
      Break down the following task into 3-6 extremely small, actionable micro-steps.
      Each step should be something that takes less than 15 minutes to do.
      Reduce the "barrier to entry" to zero. Do not nest steps.
      
      Task: "${taskContent}"
      
      Return JSON:
      [{ "content": "Open the laptop" }, { "content": "Type the title" }]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
             type: Type.OBJECT,
             properties: {
               content: { type: Type.STRING }
             }
          }
        }
      }
    });
    
    if (response.text) {
        const raw = JSON.parse(response.text);
        return raw.map((r: any) => ({
            id: `sub-${Date.now()}-${Math.random()}`,
            content: r.content,
            completed: false
        }));
    }
    return [];

  } catch (e) {
    console.error(e);
    return [];
  }
};

export const parseSmartTask = async (input: string): Promise<{
    title: string,
    priority: 'high' | 'normal',
    energyLevel: 'low' | 'medium' | 'high',
    context: string | null,
    estimatedDuration: number,
    daysFromNow: number 
}> => {
    try {
        const ai = getAI();
        const model = 'gemini-2.5-flash';

        const prompt = `
            Parse the following natural language task input into structured data.
            Input: "${input}"
            
            Current Date/Day: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            
            Rules:
            1. Extract the main task title.
            2. Infer priority (Urgent/Focus = high).
            3. Infer energy level (Study/Deep Work = high, Call/Email = medium, Chore = low).
            4. Extract context (e.g. Work, Home, Errands) if mentioned or implied.
            5. Extract duration in minutes (default to 15 if unknown).
            6. Extract Start Date relative to today (0 for today/ASAP, 1 for tomorrow, etc).
            
            Return JSON only.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['high', 'normal'] },
                        energyLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                        context: { type: Type.STRING, nullable: true },
                        estimatedDuration: { type: Type.INTEGER },
                        daysFromNow: { type: Type.INTEGER }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        throw new Error("No parse result");

    } catch (e) {
        console.error(e);
        return {
            title: input,
            priority: 'normal',
            energyLevel: 'medium',
            context: null,
            estimatedDuration: 15,
            daysFromNow: 0
        };
    }
};

export const enhanceBlockContent = async (text: string, instruction: string): Promise<string> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: `Task: ${instruction}\n\nInput Text: "${text}"\n\nReturn only the improved text.`
    });
    return response.text || text;
  } catch (e) {
    console.error(e);
    return text;
  }
}

export const refineText = async (text: string): Promise<string> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: `Refine the following text to be clearer, more concise, and grammatically perfect, while maintaining a thoughtful, natural voice. 
      Do not change the meaning. Do not add markdown headers.
      
      Input: "${text}"`
    });
    return response.text || text;
  } catch (e) {
    console.error(e);
    return text;
  }
}
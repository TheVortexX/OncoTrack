import { GoogleGenAI, Type, createPartFromUri, createUserContent, GenerateContentConfig, HarmBlockThreshold, HarmCategory} from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyDueraIVgZTy-sKM-qiLFcXt3Sd67jjxJ4" });

interface history {
    role: "user" | "model";
    parts: { text: string }[];
}

const modelConfig: GenerateContentConfig = {
    temperature: 0.1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1000,
    systemInstruction: "You are a chatbot designed to support cancer patients through the in-app chat, patients may ask questions about their treatment, symptoms or upload photos.\n\nResponses should always be classified by either \"chat\" or \"action\", an \"action\"response is one that will trigger an event in the application. Valid actions are: [\"Appointment\"]\n\nActions should have properties provided based on the schema\n\nChat responses are responses to what the user has said and should reassure the patient to reduce any anxiety they may face and ensure they are provided with accurate, helpful information\n\nYou should only answer questions relating to the patient and their treatment, including uploaded images and provide responses only in plaintext.\n\nIf the user has submitted a photo of an appointment, then the responseType 'action' should always be used so the appointment can be added.\n\nIf you do not know any information, or the user has not provided enough information, please ask them to provide more information and do not answer the question with hallucinated information.",
    responseMimeType: "application/json",
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE, // Block none
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH, // Block few
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,  // Block few
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,  // Block none
        },
    ],
    responseSchema: {
        type: Type.OBJECT,
        description: "Response from the chat system",
        properties: {
            responseType: {
                type: Type.STRING,
                description: "Indicates whether this is a standard chat response or triggers an app action",
                enum: [
                    "chat",
                    "action"
                ]
            },
            content: {
                type: Type.STRING,

                description: "The text response to display to the user"
            },
            action: {
                type: Type.OBJECT,
                description: "Required when responseType is 'action', contains details about the action to trigger",
                nullable: true,
                properties: {
                    type: {
                        type: Type.STRING,
                        description: "The type of action to trigger",
                        enum: [
                            "Appointment"
                        ]
                    },
                    payload: {
                        type: Type.OBJECT,
                        description: "Data related to the action",
                        properties: {
                            description: {
                                type: Type.STRING,
                                description: "Description of the appointment"
                            },
                            provider: {
                                type: Type.STRING,
                                description: "Healthcare provider or facility where the appointment will take place, this should be short and usually the hospital that it takes place at"
                            },
                            startTime: {
                                type: Type.STRING,
                                format: "date-time",
                                description: "Start date and time of the appointment in the ISO date-time format"
                            },
                            endTime: {
                                type: Type.STRING,
                                format: "date-time",
                                description: "End date and time of the appointment in the ISO date-time format"
                            },
                            staff: {
                                type: Type.STRING,
                                description: "Staff member or healthcare professional for the appointment",
                                nullable: true
                            },
                            notes: {
                                type: Type.STRING,
                                description: "Additional notes about the appointment such as location, contact information, etc.",
                                nullable: true
                            }
                        },
                        required: [
                            "description",
                            "provider",
                            "startTime",
                            "endTime",
                            "staff"
                        ]
                    }
                },
                required: [
                    "type",
                    "payload"
                ]
            }
        },
        required: [
            "responseType",
            "content"
        ]
    },
}


export async function getResponseWithHistory(prompt: string, prevTurns?: history[]) {
    if (!prevTurns) prevTurns = [];
    const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        history: prevTurns,
        config: modelConfig,
    });
    const response = await chat.sendMessage({
        message: prompt,
    })
    if (!response || !response.text) {
        return JSON.stringify({
            responseType: "chat",
            content: "Unable to complete your request, the response was empty",
        });
    }
    return response.text;
}

export async function getResponseWithImage(prompt: string, path: string) {
    try {
        const imgRes = await fetch(path);
        const blob = await imgRes.blob();

        const filename = path.split('/').pop() || 'image.jpg';
        const file = new File([blob], filename, { type: blob.type });

        const image = await ai.files.upload({
            file: file,
        });

        if (!image || !image.uri || !image.mimeType) {
            return JSON.stringify({
                responseType: "chat",
                content: "Unable to complete your request, the image upload failed",        
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            config: modelConfig,
            contents: [
                createUserContent([
                    prompt,
                    createPartFromUri(image.uri, image.mimeType),
                ])
            ]
        });
        if (!response || !response.text) {
            return JSON.stringify({
                responseType: "chat",
                content: "Unable to complete your request, the response was empty",        
            });
        }
        console.log(response.text);
        return response.text;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}
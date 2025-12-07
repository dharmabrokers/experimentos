import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getElfAdvice = async (
  userName: string,
  targetName: string,
  targetWishlist: string,
  userQuery: string
): Promise<string> => {
  try {
    const prompt = `
      Eres "Rodolfo el Reno Burlón", un asistente navideño sarcástico y gracioso para la familia Fuertes.
      
      SITUACIÓN:
      - Usuario: ${userName}
      - Tiene que regalar a: ${targetName}
      - LA LISTA REAL DE DESEOS DE ${targetName} ES: "${targetWishlist || "No ha escrito nada, ¡qué desastre!"}"
      
      REGLA DE ORO:
      ¡JAMÁS reveles la lista de deseos literalmente! El usuario NO puede verla. Tú eres el intermediario.
      Debes dar PISTAS, sugerencias o acertijos basados en lo que ha pedido.
      
      Instrucciones:
      1. El usuario pregunta: "${userQuery}"
      2. Responde en español, máximo 2 frases.
      3. Sé divertido, un poco absurdo y usa emojis navideños 🎄.
      4. Si preguntan "¿Qué quiere?", responde con algo tipo: "Mmm, veo que le gustan las cosas redondas..." o "Parece que quiere algo para usar en los pies...", dependiendo de la lista real.
      5. Nunca menciones el nombre de la persona a la que regala directamente, mantén el misterio aunque el usuario ya lo sepa.
    `;

    // Using gemini-flash-lite-latest for lowest latency
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    });

    return response.text || "¡Jo jo jo! Se me ha congelado el hocico. Pregúntame otra vez.";
  } catch (error) {
    console.error("Error getting advice from Gemini:", error);
    return "¡Rayos y centellas! Mi conexión mágica ha fallado. ¿Probamos otra vez?";
  }
};
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function retryGenerateContent(model, userText, retries = 3, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(userText);
            return result.response.text();
        } catch (error) {
            if (error.message.includes('429') && i < retries - 1) {
                console.log(`Retrying after ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    let userText = "";
    if (req.method === 'POST' && req.body && typeof req.body.txt === 'string') {
        userText = req.body.txt.trim();
    } else if (req.method === 'GET' && req.query && typeof req.query.txt === 'string') {
        userText = req.query.txt.trim();
    } else {
        userText = ""; // ברירת מחדל למניעת TypeError
    }

    try {
        if (!userText || userText.length < 2) {
            return res.send("read=t-אנא הקלידו את השאלה=txt,,,,,HebrewKeyboard,");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // מודל תקין
        const textResponse = await retryGenerateContent(model, userText);

        let cleanText = textResponse.replace(/[^A-Za-z0-9א-ת\s]/g, '');
        const words = cleanText.split(/\s+/).filter(w => w);
        let chunks = [];
        for (let i = 0; i < words.length; i += 10) {
            chunks.push(words.slice(i, i + 10).join(' ') + ',');
        }
        let finalOutput = chunks.join(' ');

        return res.send(`id_list_message=t-${finalOutput}&read=t-לשאלה נוספת הקלידו כעת=txt,,,,,HebrewKeyboard,`);

    } catch (error) {
        console.error("Error:", error.message);
        return res.send("read=t-אירעה שגיאה (אולי מכסה מוצתה). נסו שוב מאוחר יותר.=txt,,,,,HebrewKeyboard,");
    }
};

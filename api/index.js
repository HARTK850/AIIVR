const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    let userText = "";
    if (req.method === 'POST' && req.body && typeof req.body.txt === 'string') {
        userText = req.body.txt.trim();
    } else if (req.method === 'GET' && req.query && typeof req.query.txt === 'string') {
        userText = req.query.txt.trim();
    }

    try {
        if (!userText || userText.length < 2) {
            return res.send("read=t-אנא הקלידו את השאלה=txt,,,,,HebrewKeyboard,");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // תיקון: מודל תקין
        const result = await model.generateContent(userText);
        const textResponse = result.response.text();

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
        // החזרה להקלדה במקום ניתוק
        return res.send("read=t-אירעה שגיאה (אולי מכסה מוצתה). נסו שוב.=txt,,,,,HebrewKeyboard,");
    }
};

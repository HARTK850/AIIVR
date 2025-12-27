const { GoogleGenerativeAI } = require("@google/generative-ai");

// וודא שהגדרת את המפתח ב-Vercel תחת Environment Variables בשם GOOGLE_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = async (req, res) => {
    // הגדרה חשובה עבור ימות המשיח
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    try {
        // שליפת הטקסט - בודק את כל האפשרויות כדי למנוע קריסה
        let userText = "";
        
        if (req.body && req.body.txt) {
            userText = req.body.txt;
        } else if (req.query && req.query.txt) {
            userText = req.query.txt;
        }

        // אם זו כניסה ראשונה (אין טקסט)
        if (!userText || userText.trim().length < 2) {
            return res.send("read=t-אנא הקלידו את השאלה=txt,,,,,HebrewKeyboard,");
        }

        // פנייה ל-AI
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(userText);
        const textResponse = result.response.text();

        // ניקוי טקסט (לפי ה-PHP שלך)
        let cleanText = textResponse.replace(/[^A-Za-z0-9א-ת\s]/g, '');
        const words = cleanText.split(/\s+/).filter(w => w.length > 0);
        
        let chunks = [];
        for (let i = 0; i < words.length; i += 10) {
            chunks.push(words.slice(i, i + 10).join(' ') + ',');
        }
        let finalOutput = chunks.join(' ');

        // התשובה הסופית + פקודה להישאר בשלוחה (מניעת ניתוק)
        return res.send(`id_list_message=t-${finalOutput}&read=t-לשאלה נוספת הקלידו כעת=txt,,,,,HebrewKeyboard,`);

    } catch (error) {
        // אם יש שגיאה - מחזירים הודעה ולא מנתקים
        console.error("Error details:", error);
        return res.send("read=t-אירעה שגיאה. אנא נסו להקליד שוב.=txt,,,,,HebrewKeyboard,");
    }
};

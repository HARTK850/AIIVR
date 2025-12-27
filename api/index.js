const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    
    // קבלת הפרמטר 'txt' מהבקשה
    const query = req.method === 'POST' ? req.body : req.query;
    let userText = query.txt;

    try {
        // מצב א: כניסה ראשונה או טקסט קצר מדי - מבקש הקלדה
        if (!userText || userText.trim().length < 2) {
            return res.status(200).send("read=t-אנא הקלידו את השאלה=txt,,,,,HebrewKeyboard,");
        }

        // מצב ב: המשתמש הקליד שאלה - שולחים לגוגל
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(userText);
        const response = await result.response;
        let textResponse = response.text();

        // ניקוי תווים בעייתיים וקיצור התשובה להקראה חלקה
        let cleanText = textResponse.replace(/[^A-Za-z0-9א-ת\s.,?!]/g, ' ');
        
        // הוספת פסיקים כל 10 מילים (כמו בקוד ה-PHP ששלחת)
        let words = cleanText.split(/\s+/);
        let formattedText = "";
        for (let i = 0; i < words.length; i++) {
            formattedText += words[i] + " ";
            if ((i + 1) % 10 === 0) formattedText += ", ";
        }

        // השמעת התשובה ושמירה על הלופ (כדי שלא יתנתק!)
        // הפקודה הזו משמיעה את התשובה ואז מיד מחכה לשאלה הבאה
        return res.status(200).send(`read=t-${formattedText}. עד כאן התשובה. לשאלה נוספת הקלידו כעת וסיימו בסולמית.=txt,,,,,HebrewKeyboard,`);

    } catch (error) {
        console.error("AI Error:", error);
        return res.status(200).send("read=t-אירעה שגיאה בחיבור לבינה המלאכותית. נסו שוב מאוחר יותר.=txt,,,,,HebrewKeyboard,");
    }
};

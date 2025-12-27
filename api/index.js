const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const query = req.method === 'POST' ? req.body : req.query;

    // בימות המשיח, הקלט שנכנס מהקלדת טקסט נשמר ב-ApiEnterId
    let userText = query.ApiEnterId;

    try {
        // אם אין טקסט (כניסה ראשונה), נותנים הוראה להקליד
        if (!userText) {
            // הפקודה הזו אומרת למערכת לעבור למצב הקלדת טקסט
            return res.status(200).send('type=input_type&input_type=text&t=נא הקלידו את שאלתכם וסיימו בסולמית&say_confirm=no');
        }

        // שליחה לגמיני
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(userText);
        const response = await result.response;
        let textResponse = response.text()
            .replace(/[=*&]/g, ' ') // ניקוי תווים אסורים
            .replace(/\n/g, '. ');

        // השמעת התשובה ושליחה חזרה להקלדה נוספת (כדי שלא יתנתק)
        return res.status(200).send(`read=t-${textResponse}=UserText,yes,1,1,7,No,yes,no,type_text`);

    } catch (error) {
        console.error(error);
        return res.status(200).send('read=t-אירעה שגיאה. נסו שוב.&go_to_folder=.');
    }
};

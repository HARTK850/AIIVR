const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = async (req, res) => {
  // 1. חובה: הגדרת כותרת שמבהירה לימות המשיח שזה טקסט נקי בעברית
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  const query = req.method === 'POST' ? req.body : req.query;
  
  // קליטת הטקסט (תומך גם בפרמטר שחוזר מזיהוי דיבור וגם בבדיקות ידניות)
  let userText = query.ApiAnswer || query.text;

  console.log("Request received. Text:", userText);

  try {
    // 2. אם זו הכניסה הראשונה לשלוחה (אין טקסט)
    if (!userText) {
      console.log("Welcome message");
      // שולחים רק את הטקסט להקראה. ההקלטה תתבצע בגלל ההגדרות ב-ext.ini
      return res.status(200).send('read=t-שלום, אני גמיני. על מה תרצו לדבר איתי?'); 
    }

    // 3. יש טקסט מהמשתמש - שליחה לגוגל
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(userText);
    const response = await result.response;
    
    // ניקוי הטקסט מתשובת ה-AI
    let textResponse = response.text()
        .replace(/\*/g, '')      // הסרת כוכביות
        .replace(/=/g, '-')      // החלפת שווה במקף (קריטי לימות המשיח!)
        .replace(/&/g, 'ו')      // החלפת & ב'ו'
        .replace(/\n/g, '. ');   // החלפת ירידת שורה בנקודה

    console.log("Gemini reply:", textResponse);

    // שליחת התשובה
    return res.status(200).send(`read=t-${textResponse}`);

  } catch (error) {
    console.error("Error:", error);
    return res.status(200).send('read=t-אירעה שגיאה, אנא נסו שוב.');
  }
};

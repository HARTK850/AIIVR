const { GoogleGenerativeAI } = require("@google/generative-ai");

// קבלת המפתח
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = async (req, res) => {
  // בדיקה אם הבקשה הגיעה ב-GET או POST
  const query = req.method === 'POST' ? req.body : req.query;

  // קבלת הטקסט מהמשתמש. בימות המשיח, זיהוי דיבור חוזר לרוב ב-ApiAnswer
  let userText = query.ApiAnswer || query.text;

  // הדפסה ללוגים של Vercel לצורך דיבוג
  console.log("Incoming request query:", query);

  try {
    // 1. מצב התחלה: אם אין טקסט (המשתמש רק נכנס לשלוחה)
    if (!userText) {
      console.log("No text provided, sending welcome message.");
      // שולח הודעה ומבקש זיהוי דיבור לתוך המשתנה ApiAnswer
      // val_name=ApiAnswer אומר למערכת לשמור את מה שהמשתמש אמר תחת השם הזה
      return res.status(200).send('read=t-שלום, אני גמיני. על מה תרצו לדבר איתי היום?=ApiAnswer,yes,t,no');
    }

    // 2. המשתמש דיבר: שליחה לגוגל
    console.log("User said:", userText);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(userText);
    const response = await result.response;
    let textResponse = response.text();

    console.log("Gemini response:", textResponse);

    // ניקוי תווים בעייתיים לימות המשיח
    textResponse = textResponse.replace(/=/g, '-').replace(/&/g, 'ו').replace(/\n/g, '. ');

    // 3. החזרת התשובה
    return res.status(200).send(`read=t-${textResponse}=ApiAnswer,yes,t,no`);

  } catch (error) {
    console.error("Critical Error:", error);
    // במקרה של שגיאה, המערכת תקריא שגיאה במקום לנתק
    return res.status(200).send('read=t-אירעה שגיאה פנימית במערכת, אנא נסו שוב מאוחר יותר.');
  }
};

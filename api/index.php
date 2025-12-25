<?php
 
// הגדרת כותרת התגובה לטקסט רגיל (או פורמט אחר שתבחר)
header('Content-Type: text/plain; charset=utf-8');
 
// פונקציה המדמה את הלוגיקה של Flask
function handle_gemini_request() {
    // קבלת הפרמטר 'txt' מה-URL (מקביל ל-request.args.get)
    $txt = isset($_GET['txt']) ? $_GET['txt'] : null;
 
    if (!$txt || mb_strlen(trim($txt)) < 2) {
        return "read=t-אנא הקלד שאלה ברורה ומלאה.=txt,,,,,HebrewKeyboard,";
    }
 
    $api_key = "AIzaSyC3hNFwIeaC0oB2Gx4yi5i7gujz2vjkO80"; 
    $model = "gemini-2.0-flash"; 
    $api_url = "https://generativelanguage.googleapis.com/v1/models/{$model}:generateContent?key={$api_key}";
 
    $data = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $txt]
                ]
            ]
        ]
    ];
 
    $json_data = json_encode($data);
 
    // אתחול cURL
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    // התעלמות מאימות SSL (מקביל ל-verify=False)
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
 
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
 
    // טיפול בשגיאות תקשורת
    if ($response === false) {
        return "read=t-לשרת לוקח יותר מדי זמן לענות. נסה שוב מאוחר יותר.=txt,,,,,HebrewKeyboard,";
    }
 
    if ($http_code !== 200) {
        return "read=t-שגיאה בתקשורת עם הבינה המלאכותית. ייתכן ששם המודל אינו נכון.=txt,,,,,HebrewKeyboard,";
    }
 
    $response_json = json_decode($response, true);
 
    // בדיקה אם קיימת תשובה
    if (!isset($response_json['candidates']) || empty($response_json['candidates'])) {
        return "read=t-השאלה שלך נחסמה או שלא התקבלה תשובה ברורה. נסה לשאול אחרת.=txt,,,,,HebrewKeyboard,";
    }
 
    $generated_text = $response_json['candidates'][0]['content']['parts'][0]['text'];
 
    // עיבוד הטקסט: הסרת סימנים מיוחדים (נשארים רק אותיות, מספרים ורווחים)
    // הערה: Regex ב-PHP דורש תמיכה ב-UTF-8 באמצעות הדגל /u
    $generated_text = preg_replace('/[^A-Za-z0-9א-ת\s]/u', '', $generated_text);
 
    // חילוק למילים והוספת פסיק אחרי כל 10 מילים
    $words = preg_split('/\s+/', trim($generated_text));
    $chunks = [];
    $word_count = count($words);
 
    for ($i = 0; $i < $word_count; $i += 10) {
        $slice = array_slice($words, $i, 10);
        $chunk = implode(' ', $slice);
        $chunks[] = $chunk . ',';
    }
 
    $result = implode(' ', $chunks);
 
    return "id_list_message=t-{$result}";
}
 
// הרצת הפונקציה והדפסת התוצאה
echo handle_gemini_request();
 
?>

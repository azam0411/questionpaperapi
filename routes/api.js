const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Question = require("../models/Question");
const fs = require("fs");
const OpenAi = require("openai");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Endpoint: Upload PDF and Parse Questions
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    // res.status(200).json({ message: "File uploaded" });
    const dataBuffer = fs.readFileSync(filePath);
    console.log("Uploaded file:", req.file.originalname);

    // Parse the PDF
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;
    console.log(text);

    // Extract questions (basic example, adapt as needed)
    const questions = text
      .split("\n")
      .filter((line) => line.trim().endsWith("?"));
    console.log(questions);

    const generatedQuestions = [];
    for (const q of questions) {
      console.log("Question:", q);
      const generatedQuestion = await utilFunction(q);
      console.log("Generated question:", generatedQuestion);
      const obj = JSON.parse(generatedQuestion);
      console.log("Generated question object:", obj);
      generatedQuestions.push({ ...obj, originalQuestion: q });
    }
    console.log("Generated questions:", generatedQuestions);
    const savedQuestions = [];
    for (const obj of generatedQuestions) {
      const question = {
        originalQuestion: obj.originalQuestion,
        generatedQuestions: obj.question,
        options: Object.values(obj.answers),
        correctAnswer: obj.correctAnswer,
        metadata: { fileName: req.file.originalname },
      };
      savedQuestions.push(question);
    }
    console.log("Saved questions:", savedQuestions);
    await Question.insertMany(savedQuestions);

    fs.unlinkSync(filePath);

    res.status(200).json({
      message: "Here are your new questions",
      data: generatedQuestions,
    });
  } catch (err) {
    console.log(JSON.stringify(err));
    res
      .status(500)
      .json({ error: "Failed to parse PDF", details: err.message });
  }
});

var utilFunction = async (question) => {
  try {
    const prompt = `Can you generate a different question with some similarity for all the questions in the following: "${question}" and for each question return 4 answers in which one is correct and return in json string format as this format is mandatory
        and return response like this 
        {
     "question": "Who was the first person to walk on the moon?",
     "answers": {
       "a": "Neil Armstrong",
       "b": "Buzz Aldrin",
       "c": "Michael Collins",
       "d": "Yuri Gagarin"
     },
       "correctAnswer": "a"
    }`;
    const openai = new OpenAi({
      apiKey: process.env.OPENAI_API_KEY1, // This is the default and can be omitted
    });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Specify the model (e.g., gpt-3.5-turbo or gpt-4)
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150, // Set maximum token limit for the response
      temperature: 0.7, // Control randomness (0-1)
    });
    console.log("Response:", response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    throw error;
  }
};

module.exports = router;

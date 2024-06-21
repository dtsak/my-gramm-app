const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('./questions.db');

// code from gemini




app.get('/start-test', (req, res) => {
    db.run('DELETE FROM scores', err => {
        if (err) {
            console.error('Error clearing scores table:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }

        // Insert initial scores with 'I' answer for each question
        const insertScores = db.prepare('INSERT INTO scores (aa, answer) VALUES (?, ?)');
        db.all('SELECT aa FROM questions', [], (err, rows) => {
            if (err) {
                console.error('Error fetching questions for initial scores:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }

            rows.forEach(row => {
                insertScores.run(row.aa, 'I', err => {
                    if (err) {
                        console.error('Error inserting initial score:', err.message);
                    }
                });
            });
            insertScores.finalize();

            // Fetch total number of questions and send it in the response
            db.get('SELECT COUNT(*) AS total_questions FROM questions', (err, row) => {
                if (err) {
                    console.error('Error fetching total questions:', err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }

                const totalQuestions = row.total_questions || 0; // Default to 0 if no questions found
                res.json({ success: true, totalQuestions });
            });
        });
    });
});



// Endpoint to get questions
app.get('/questions', (req, res) => {
    db.all('SELECT * FROM questions', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const questions = rows.map(row => {
            const answers = [
                { text: row.answera, index: 1 },
                { text: row.answerb, index: 2 },
                { text: row.answerc, index: 3 },
                { text: row.answerd, index: 4 },
            ];

            if (row.answere) {
                answers.push({ text: row.answere, index: 5 });
            }

            return {
                question: row.questionf,
                answers: answers.filter(answer => answer.text !== null),
                typeq: row.typeq,
                right1: row.right1,
                right2: row.right2,
                aa: row.aa // Include the aa field for tracking scores
            };
        });

        res.json({ questions });
    });
});

// Endpoint to update scores
app.post('/submit', (req, res) => {
    const { aa, isCorrect } = req.body;
    const answer = isCorrect ? 'T' : 'F';

    db.run('INSERT OR REPLACE INTO scores (aa, answer) VALUES (?, ?)', [aa, answer], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});



app.get('/scores', (req, res) => {
    const query = `
        SELECT 
            q.aa, q.questionf, s.answer, q.right1, q.right2, q.answera, q.answerb, q.answerc, q.answerd, q.answere, q.typeq
        FROM 
            questions q
        LEFT JOIN 
            scores s
        ON 
            q.aa = s.aa
    `;




    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const scores = rows.map(row => {
            let correctAnswer1 = null;
            let correctAnswer2 = null;

            if (row.right1 === '1') correctAnswer1 = row.answera;
            else if (row.right1 === '2') correctAnswer1 = row.answerb;
            else if (row.right1 === '3') correctAnswer1 = row.answerc;
            else if (row.right1 === '4') correctAnswer1 = row.answerd;
            else if (row.right1 === '5') correctAnswer1 = row.answere;

            if (row.typeq === '5') {
                if (row.right2 === '1') correctAnswer2 = row.answera;
                else if (row.right2 === '2') correctAnswer2 = row.answerb;
                else if (row.right2 === '3') correctAnswer2 = row.answerc;
                else if (row.right2 === '4') correctAnswer2 = row.answerd;
                else if (row.right2 === '5') correctAnswer2 = row.answere;
            }

            return {
                aa: row.aa,
                question: row.questionf,
                userAnswer: row.answer,
                correctAnswer1: correctAnswer1,
                correctAnswer2: row.typeq === '5' ? correctAnswer2 : null
            };
        });

        res.json({ scores });
    });
});







// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

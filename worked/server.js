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

// Clear the scores table when the server starts
db.run('DELETE FROM scores', err => {
    if (err) {
        console.error('Error clearing scores table:', err.message);
    }
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

// Endpoint to get scores
app.get('/scores', (req, res) => {
    db.all('SELECT * FROM scores', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ scores: rows });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

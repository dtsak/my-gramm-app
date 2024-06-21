document.addEventListener('DOMContentLoaded', function () {
    const app = document.getElementById('app');
    let questions = [];
    let currentQuestionIndex = 0;
    let ignoredQuestions = [];
    let answeredQuestions = [];
    let score = 0;

    function loadQuestions() {
        fetch('/questions')
            .then(response => response.json())
            .then(data => {
                questions = data.questions;
                displayQuestion();
            })
            .catch(error => console.error('Error fetching questions:', error));
    }

    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            app.innerHTML = `
                <h2>${question.question}</h2>
                ${question.answers.map((answer, index) => `
                    <button class="btn" data-answer="${index}">${answer.text}</button>
                `).join('')}
                <button class="btn" id="ignore">Ignore</button>
            `;
            document.querySelectorAll('.btn[data-answer]').forEach(button => {
                button.addEventListener('click', handleAnswer);
            });
            document.getElementById('ignore').addEventListener('click', ignoreQuestion);
        } else {
            displayResults();
        }
    }

    function handleAnswer(event) {
        const selectedAnswerIndex = parseInt(event.target.getAttribute('data-answer'));
        const question = questions[currentQuestionIndex];
        const selectedAnswer = question.answers[selectedAnswerIndex];

        if (selectedAnswer.correct) {
            score++;
            answeredQuestions.push({ ...question, correct: true });
        } else {
            answeredQuestions.push({ ...question, correct: false });
        }

        currentQuestionIndex++;
        displayQuestion();
    }

    function ignoreQuestion() {
        ignoredQuestions.push(questions[currentQuestionIndex]);
        currentQuestionIndex++;
        displayQuestion();
    }

    function displayResults() {
        app.innerHTML = `
            <h2>Results</h2>
            <p>Score: ${score} / ${questions.length}</p>
            <h3>Ignored Questions</h3>
            ${ignoredQuestions.length > 0 ? `
                <ul>
                    ${ignoredQuestions.map((question, index) => `
                        <li>
                            ${question.question}
                            <button class="btn" data-question="${index}">Answer</button>
                        </li>
                    `).join('')}
                </ul>
            ` : `<p>No ignored questions.</p>`}
            <h3>Answered Questions</h3>
            <ul>
                ${answeredQuestions.map(q => `
                    <li>${q.question} - ${q.correct ? 'Correct' : 'Incorrect'}</li>
                `).join('')}
            </ul>
        `;

        document.querySelectorAll('.btn[data-question]').forEach(button => {
            button.addEventListener('click', handleIgnoredQuestion);
        });
    }

    function handleIgnoredQuestion(event) {
        const questionIndex = parseInt(event.target.getAttribute('data-question'));
        questions.splice(currentQuestionIndex, 0, ignoredQuestions.splice(questionIndex, 1)[0]);
        displayQuestion();
    }

    loadQuestions();
});

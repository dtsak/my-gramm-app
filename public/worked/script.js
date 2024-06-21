document.addEventListener('DOMContentLoaded', function () {
    const app = document.getElementById('app');
    let questions = [];
    let currentQuestionIndex = 0;
    let ignoredQuestions = [];
    let selectedAnswers = [];
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
            selectedAnswers = [];
            app.innerHTML = `
                <h2>${question.question}</h2>
                ${question.answers.map((answer, index) => `
                    <button class="btn answer-btn" data-answer-index="${answer.index}">${answer.text}</button>
                `).join('')}
                <button class="btn" id="submit">Submit</button>
                <button class="btn" id="ignore">Ignore</button>
            `;
            document.querySelectorAll('.answer-btn').forEach(button => {
                button.addEventListener('click', handleAnswerSelection);
            });
            document.getElementById('submit').addEventListener('click', handleSubmit);
            document.getElementById('ignore').addEventListener('click', ignoreQuestion);
        } else {
            displayResults();
        }
    }

    function handleAnswerSelection(event) {
        const selectedAnswerIndex = event.target.getAttribute('data-answer-index');
        const question = questions[currentQuestionIndex];

        if (question.typeq === '4') {
            selectedAnswers = [selectedAnswerIndex]; // Only one answer allowed
        } else if (question.typeq === '5') {
            // Toggle selection for multiple answers
            if (selectedAnswers.includes(selectedAnswerIndex)) {
                selectedAnswers = selectedAnswers.filter(index => index !== selectedAnswerIndex);
                console.log('Selected Answers 5:', selectedAnswers);
            } else {
                selectedAnswers.push(selectedAnswerIndex);
            }
        }

        console.log('Selected Answers:', selectedAnswers);

        // Highlight selected answers
        document.querySelectorAll('.answer-btn').forEach(button => {
            if (selectedAnswers.includes(button.getAttribute('data-answer-index'))) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }

    function handleSubmit() {
        const question = questions[currentQuestionIndex];
        const correctAnswers = [question.right1];
        if (question.typeq === '5') {
            correctAnswers.push(question.right2);
        }

        console.log('Selected answers:', selectedAnswers);
        console.log('Correct answers:', correctAnswers);

        let isCorrect = false;
        if (question.typeq === '4') {
            isCorrect = correctAnswers.includes(selectedAnswers[0]);
        } else if (question.typeq === '5') {
            isCorrect = selectedAnswers.length === 2 && selectedAnswers.every(answer => correctAnswers.includes(answer));
        }

        fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                aa: question.aa,
                isCorrect
            })
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  if (isCorrect) {
                      score++;
                  }
                  currentQuestionIndex++;
                  displayQuestion();
              }
          }).catch(error => console.error('Error submitting answer:', error));
    }

    function ignoreQuestion() {
        ignoredQuestions.push(questions[currentQuestionIndex]);
        currentQuestionIndex++;
        displayQuestion();
    }

    function displayResults() {
        fetch('/scores')
            .then(response => response.json())
            .then(data => {
                const scoreData = data.scores;

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
                        ${questions.map((question, index) => {
                            const answered = scoreData.find(score => score.aa === question.aa);
                            if (answered) {
                                return `<li>${question.question} - ${answered.answer === 'T' ? 'Correct' : 'Incorrect'}</li>`;
                            }
                            return '';
                        }).join('')}
                    </ul>
                `;

                document.querySelectorAll('.btn[data-question]').forEach(button => {
                    button.addEventListener('click', handleIgnoredQuestion);
                });
            })
            .catch(error => console.error('Error fetching scores:', error));
    }

    function handleIgnoredQuestion(event) {
        const questionIndex = parseInt(event.target.getAttribute('data-question'));
        questions.splice(currentQuestionIndex, 0, ignoredQuestions.splice(questionIndex, 1)[0]);
        displayQuestion();
    }

    loadQuestions();
});

document.addEventListener('DOMContentLoaded', function () {
    const app = document.getElementById('app');
    let questions = [];
    let currentQuestionIndex = 0;
    let ignoredQuestions = [];
    let selectedAnswers = [];
    let score = 0;
    let totalQuestions = 0;

    startTest();

    function startTest() {
        fetch('/start-test')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    totalQuestions = data.totalQuestions;
                    loadQuestions();
                }
            })
            .catch(error => console.error('Error starting test:', error));
    }

    function loadQuestions() {
        fetch('/questions')
            .then(response => response.json())
            .then(data => {
                questions = data.questions;
                displayQuestion();
            })
            .catch(error => console.error('Error fetching questions:', error));
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            selectedAnswers = [];
            
            // Shuffle the answers array
            shuffle(question.answers);

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
        } else if (ignoredQuestions.length > 0) {
            displayIgnoredQuestions();
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
            } else {
                selectedAnswers.push(selectedAnswerIndex);
            }
        }

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

        let isCorrect = false;
        if (question.typeq === '4') {
            isCorrect = selectedAnswers.length === 1 && correctAnswers.includes(selectedAnswers[0]);
        } else if (question.typeq === '5') {
            isCorrect = selectedAnswers.length === correctAnswers.length &&
                        selectedAnswers.every(answer => correctAnswers.includes(answer));
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
                      console.log("score till now is = " + score );
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

    function displayIgnoredQuestions() {
        app.innerHTML = `
            <h2>Ignored Questions</h2>
            <ul>
                ${ignoredQuestions.map((question, index) => `
                    <li>
                        ${question.question}
                        <button class="btn" data-question-index="${index}">Answer</button>
                    </li>
                `).join('')}
            </ul>
        `;

        document.querySelectorAll('.btn[data-question-index]').forEach(button => {
            button.addEventListener('click', handleIgnoredQuestion);
        });
    }

    function handleIgnoredQuestion(event) {
        const questionIndex = parseInt(event.target.getAttribute('data-question-index'));
        questions.splice(currentQuestionIndex, 0, ignoredQuestions.splice(questionIndex, 1)[0]);
        displayQuestion();
    }

    function displayResults() {
        fetch('/scores')
            .then(response => response.json())
            .then(data => {
                const scoreData = data.scores;
                const correctAnswers = scoreData.filter(score => score.answer === 'T').length;
                const answeredQuestionsCount = totalQuestions - scoreData.filter(score => score.answer === 'I').length;
                const percentageCorrect = (score / answeredQuestionsCount * 100).toFixed(2);
    
                app.innerHTML = `
                    <h2>Results</h2>
                    <p>Percentage of Correct Answers: ${percentageCorrect}%</p>
                    <p>Correct Answers / Total Answers: ${score} / ${answeredQuestionsCount}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Question Number</th>
                                <th>Question</th>
                                <th>User Answer</th>
                                <th>Correct Answer</th>
                                <th>Second Correct Answer</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${scoreData.map((score, index) => {
     
                                return `
                                    <tr>
                                        <td>${score.aa}</td>
                                        <td>${score.question}</td>
                                        <td>${score.userAnswer ==='T' ? "Correct" :"False" }</td>
                                        <td>${score.correctAnswer1}</td>
                                        <td>${score.correctAnswer2 || 'N/A'} </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
            })
            .catch(error => console.error('Error fetching scores:', error));
    }

    loadQuestions();
});

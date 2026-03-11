/* =======================
   ELEMENTS
======================= */
const quizBox = document.querySelector('.quiz-box');
const nextBtn = document.querySelector('.next-btn');
const optionList = document.querySelector('.option-list');
const questionText = document.querySelector('.question-text');
const questionTotal = document.querySelector('.question-total');
const headerScore = document.querySelector('.header-score');
const resultBox = document.querySelector('.result-box');
const tryAgainBtn = document.querySelector('.tryAgain-btn');

const progressValue = document.querySelector(".progress-value");
const circularProgress = document.querySelector(".circular-progress");
const scoreText = document.querySelector(".score-text");

/* =======================
   DAILY QUESTION LOGIC
======================= */
function getDailyQuestions(allQuestions, count = 5) {
  const today = new Date().toDateString();
  const saved = localStorage.getItem("dailyQuiz");

  if (saved) {
    const data = JSON.parse(saved);
    if (data.date === today) return data.questions;
  }

  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  const dailyQuestions = shuffled.slice(0, count);

  localStorage.setItem(
    "dailyQuiz",
    JSON.stringify({ date: today, questions: dailyQuestions })
  );

  return dailyQuestions;
}

// 👉 Only 5 questions per day
const quizQuestions = getDailyQuestions(questions);

/* =======================
   QUIZ STATE
======================= */
let questionCount = 0;
let questionNumb = 1;
let userScore = 0;

/* =======================
   TIMER
======================= */
const TOTAL_TIME = 30;
let timeLeft = TOTAL_TIME;
let timerId = null;
let answered = false;

/* =======================
   START QUIZ
======================= */
showQuestions(questionCount);
questionCounter(questionNumb);

/* =======================
   TRY AGAIN
======================= */
tryAgainBtn.onclick = () => {
  quizBox.style.display = 'flex';
  resultBox.classList.remove('active');

  questionCount = 0;
  questionNumb = 1;
  userScore = 0;

  headerScore.textContent = `Score: 0 / ${quizQuestions.length}`;
  nextBtn.classList.add("disabled");

  progressValue.textContent = "0%";
  circularProgress.style.background =
    "conic-gradient(#c40094 0deg, rgba(255,255,255,0.1) 0deg)";
  scoreText.textContent = `Your Score 0 out of ${quizQuestions.length}`;

  showQuestions(questionCount);
  questionCounter(questionNumb);
};

/* =======================
   NEXT BUTTON
======================= */
nextBtn.onclick = () => {
  if (nextBtn.classList.contains("disabled")) return;

  if (questionCount < quizQuestions.length - 1) {
    questionCount++;
    questionNumb++;
    showQuestions(questionCount);
    questionCounter(questionNumb);
  } else {
    stopTimer();
    showResult();
  }
};

/* =======================
   SHOW QUESTION
======================= */
function showQuestions(index) {
  // 🔥 FIX: dynamic numbering (1–5)
  questionText.textContent =
    `${index + 1}. ${quizQuestions[index].question}`;

  optionList.innerHTML = "";

  quizQuestions[index].options.forEach(option => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "option";
    optionDiv.innerHTML = `<span>${option}</span>`;
    optionDiv.onclick = () => optionSelected(optionDiv);
    optionList.appendChild(optionDiv);
  });

  nextBtn.classList.add("disabled");
  answered = false;
  startTimer();
}

/* =======================
   OPTION SELECT
======================= */
function optionSelected(answer) {
  if (answered) return;

  answered = true;
  stopTimer();

  const userAnswer = answer.textContent.trim();
  const correctAnswer = quizQuestions[questionCount].answer;
  const options = optionList.children;

  if (userAnswer === correctAnswer) {
    answer.classList.add("correct");
    userScore++;
    headerScore.textContent =
      `Score: ${userScore} / ${quizQuestions.length}`;
  } else {
    answer.classList.add("incorrect");
    for (let opt of options) {
      if (opt.textContent.trim() === correctAnswer) {
        opt.classList.add("correct");
      }
    }
  }

  for (let opt of options) opt.classList.add("disabled");
  nextBtn.classList.remove("disabled");
}

/* =======================
   QUESTION COUNTER
======================= */
function questionCounter(index) {
  questionTotal.textContent =
    `${index} of ${quizQuestions.length} Questions`;
}

/* =======================
   TIMER
======================= */
function startTimer() {
  stopTimer();
  timeLeft = TOTAL_TIME;

  const bar = document.getElementById("progress-bar");
  const timeEl = document.getElementById("time");

  bar.style.width = "100%";
  bar.style.background = "green";
  timeEl.textContent = timeLeft;

  timerId = setInterval(() => {
    if (answered) return;

    timeLeft--;
    timeEl.textContent = timeLeft;
    bar.style.width = (timeLeft / TOTAL_TIME) * 100 + "%";

    if (timeLeft <= 5) bar.style.background = "red";

    if (timeLeft <= 0) {
      answered = true;
      stopTimer();

      setTimeout(() => {
        if (questionCount < quizQuestions.length - 1) {
          questionCount++;
          questionNumb++;
          showQuestions(questionCount);
          questionCounter(questionNumb);
        } else {
          showResult();
        }
      }, 500);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

/* =======================
   RESULT
======================= */
function showResult() {
  quizBox.style.display = 'none';
  resultBox.classList.add('active');

  const total = quizQuestions.length;
  const scorePercent = Math.floor((userScore / total) * 100);

  scoreText.textContent = `Your Score ${userScore} out of ${total}`;

    saveScoreHistory(userScore,total);
  showLeaderboard();
  updateWeeklyBadge();
    updateDailyStreak();



  if (scorePercent === 0) {
    progressValue.textContent = "0%";
    circularProgress.style.background =
      `conic-gradient(#c40094 0deg, rgba(255,255,255,0.1) 0deg)`;
    return;
  }

  let progress = 0;

  const interval = setInterval(() => {
    progress++;
    progressValue.textContent = `${progress}%`;

    circularProgress.style.background =
      `conic-gradient(#c40094 ${progress * 3.6}deg, rgba(13, 194, 226, 0.1) 0deg)`;

    if (progress >= scorePercent) clearInterval(interval);
  }, 20);
}






function saveScoreHistory(score,total){

  const history = JSON.parse(localStorage.getItem("quizHistory")) || [];

  const today = new Date();

  const result = {
    date: today.toLocaleDateString(),
    score: score,
    total: total
  };

  history.push(result);

  localStorage.setItem("quizHistory",JSON.stringify(history));

}



function showLeaderboard(){

  const history = JSON.parse(localStorage.getItem("quizHistory")) || [];

  const leaderboard = document.getElementById("leaderboard");

  leaderboard.innerHTML="";

  history.sort((a,b)=> b.score-a.score);

  const top5 = history.slice(0,5);

  top5.forEach((item,index)=>{

    const div=document.createElement("div");

    div.classList.add("leader-item");

    div.style.animationDelay = index*0.2+"s";

    div.innerHTML=
    `<span>#${index+1}</span>
     <span>${item.score}/${item.total}</span>`;

    leaderboard.appendChild(div);

  });

}






function updateWeeklyBadge(){

  const history = JSON.parse(localStorage.getItem("quizHistory")) || [];

  const badge = document.getElementById("weekly-badge");

  if(history.length === 0){
    badge.textContent = "No badge yet";
    return;
  }

  const last7 = history.slice(-7);

  let totalScore = 0;
  let totalQuestions = 0;

  last7.forEach(item=>{
    totalScore += item.score;
    totalQuestions += item.total;
  });

  const avg = totalScore / totalQuestions;

  if(avg >= 0.9){
    badge.textContent = "🌱 Eco Hero";
  }
  else if(avg >= 0.75){
    badge.textContent = "🌿 Eco Saver";
  }
  else if(avg >= 0.5){
    badge.textContent = "🌍 Eco Learner";
  }
  else{
    badge.textContent = "📘 Beginner";
  }

}




function updateDailyStreak(){

  const today = new Date().toDateString();

  let streakData = JSON.parse(localStorage.getItem("quizStreak")) || {
    lastDate: null,
    streak: 0
  };

  if(streakData.lastDate === today){
    // already played today
  }
  else{

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate()-1);

    if(streakData.lastDate === yesterday.toDateString()){
      streakData.streak += 1;
    }
    else{
      streakData.streak = 1;
    }

    streakData.lastDate = today;

    localStorage.setItem("quizStreak", JSON.stringify(streakData));
  }

  document.getElementById("streak-count").textContent = streakData.streak;

}
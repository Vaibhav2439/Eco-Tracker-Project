document.addEventListener("DOMContentLoaded", () => {

const quizLink = document.getElementById("quizChallengeLink");
const quizCard = document.getElementById("quizCard");
const quizDesc = document.getElementById("quizCardDesc");
const quizOverlay = document.getElementById("quizOverlay");
const closeQuizBtn = document.getElementById("closeQuizBtn");

const hoursEl = document.getElementById("modalHours");
const minutesEl = document.getElementById("modalMinutes");
const secondsEl = document.getElementById("modalSeconds");

const user = JSON.parse(localStorage.getItem("user"));
if(!user) return;

const userId = user.email || user._id || user.username;

const quizKey = `quizPlayed_${userId}`;

checkQuizStatus();

function checkQuizStatus(){

    const playedData = localStorage.getItem(quizKey);

    if(!playedData) return;

    const playedDate = new Date(playedData);
    const today = new Date();

    if(playedDate.toDateString() === today.toDateString()){

        lockQuiz();

    }

}

function lockQuiz(){

    quizCard.classList.add("quiz-locked");

    quizDesc.innerHTML =
    `You've already completed today's challenge.
     Check back after midnight for new questions!`;

    quizLink.classList.add("quiz-link-locked");
    quizLink.innerHTML = `<i class="fa-solid fa-lock"></i> Locked until midnight`;

    quizLink.addEventListener("click", e=>{
        e.preventDefault();
        quizOverlay.style.display = "flex";
        startCountdown();
    });

}

window.markQuizPlayed = function(){

    localStorage.setItem(quizKey, new Date().toISOString());

}

closeQuizBtn.onclick = ()=>{

    quizOverlay.style.display = "none";

}

function startCountdown(){

    function update(){

        const now = new Date();
        const midnight = new Date();

        midnight.setHours(24,0,0,0);

        const diff = midnight - now;

        const hours = Math.floor(diff/1000/60/60);
        const minutes = Math.floor((diff/1000/60)%60);
        const seconds = Math.floor((diff/1000)%60);

        hoursEl.textContent = String(hours).padStart(2,"0");
        minutesEl.textContent = String(minutes).padStart(2,"0");
        secondsEl.textContent = String(seconds).padStart(2,"0");

    }

    update();
    setInterval(update,1000);

}

});
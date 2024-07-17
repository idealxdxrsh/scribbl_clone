const socket = io();

let username = '';
let isDrawing = false;
let context;
let canvas;
let lastX = 0;
let lastY = 0;

window.onload = () => {
  username = prompt('Enter your name:');
  socket.emit('join', username);

  canvas = document.getElementById('drawing-board');
  context = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  canvas.addEventListener('mousedown', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    context.beginPath();
    context.moveTo(lastX, lastY);
    socket.emit('drawing', { type: 'begin', x: lastX, y: lastY });
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || e.buttons !== 1) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    context.lineTo(x, y);
    context.stroke();
    socket.emit('drawing', { type: 'draw', x, y });
  });

  canvas.addEventListener('mouseup', () => {
    if (!isDrawing) return;
    context.closePath();
    socket.emit('drawing', { type: 'end' });
  });

  document.getElementById('send-chat').addEventListener('click', () => {
    const message = document.getElementById('chat-input').value.trim();
    if (message) {
      socket.emit('guess', { username, message });
      document.getElementById('chat-input').value = '';
    }
  });

  document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('send-chat').click();
    }
  });

  socket.on('drawing', (data) => {
    if (data.type === 'begin') {
      context.beginPath();
      context.moveTo(data.x, data.y);
    } else if (data.type === 'draw') {
      context.lineTo(data.x, data.y);
      context.stroke();
    } else if (data.type === 'end') {
      context.closePath();
    } else if (data.type === 'clear') {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  });

  socket.on('message', (data) => {
    const chatBox = document.getElementById('chat-box');
    const newMessage = document.createElement('div');
    newMessage.classList.add('chat-message');
    if (data.isCorrect) {
      newMessage.textContent = `... ${data.username} guessed the word!`;
      newMessage.classList.add('correct-guess');
    } else {
      newMessage.textContent = `${data.username}: ${data.message}`;
    }
    chatBox.appendChild(newMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  socket.on('user-list', (users) => {
    updateScoreBoard(users);
  });

  socket.on('new-turn', (data) => {
    const turnInfo = document.getElementById('turn-info');
    turnInfo.textContent = `${data.user.username}'s turn to draw`;
    isDrawing = (data.user.id === socket.id);
    if (isDrawing) {
      document.getElementById('current-word').textContent = `Your word: ${data.word}`;
    } else {
      document.getElementById('current-word').textContent = `Hint: ${data.hint}`;
    }
  });

  socket.on('start-timer', (timeLeft) => {
    startTimer(timeLeft);
  });

  socket.on('current-turn', (data) => {
    const turnInfo = document.getElementById('turn-info');
    turnInfo.textContent = `${data.username}'s turn to draw`;
  });

  let timer;
  function startTimer(timeLeft) {
    const timerDisplay = document.getElementById('timer');
    timerDisplay.textContent = `Time left: ${timeLeft}s`;
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = `Time left: ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  }

  socket.on('game-over', (data) => {
    alert(data.message);
    clearInterval(timer);
  });

  socket.on('winner', (data) => {
    alert(`The winner is ${data.username} with ${data.score} points!`);
  });

  function updateScoreBoard(users) {
    const scoreBoard = document.getElementById('score-board');
    scoreBoard.innerHTML = '<h3>Score Board</h3>';
    users.forEach(user => {
      const scoreItem = document.createElement('div');
      scoreItem.textContent = `${user.username}: ${user.score} points`;
      scoreBoard.appendChild(scoreItem);
    });
  }

  document.getElementById('pen-color').addEventListener('change', (e) => {
    context.strokeStyle = e.target.value;
  });

  document.getElementById('pen-thickness').addEventListener('change', (e) => {
    context.lineWidth = e.target.value;
  });

  document.getElementById('clear-canvas').addEventListener('click', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('drawing', { type: 'clear' });
  });

  socket.on('current-state', (data) => {
    updateScoreBoard(data.users);
    if (data.currentWord) {
      document.getElementById('current-word').textContent = isDrawing ? `Your word: ${data.currentWord}` : `Hint: ${data.hint}`;
    }
    startTimer(data.timeLeft);
    const currentUser = data.users[data.currentTurn];
    if (currentUser) {
      document.getElementById('turn-info').textContent = `${currentUser.username}'s turn to draw`;
    }
  });

  socket.on('waiting-lobby', (data) => {
    const waitingLobby = document.getElementById('waiting-lobby');
    waitingLobby.style.display = 'block';
    waitingLobby.textContent = data.message;
  });
};

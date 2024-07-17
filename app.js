const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = [];
let currentTurn = 0;
let currentWord = '';
let currentHint = '';
let timer;
const roundDuration = 90;
const rounds = 3;
const wordList = [
  'cat', 'dog', 'house', 'car', 'tree', 'flower', 'sun', 'mountain', 'river', 'book', 'phone', 'apple', 'banana', 'fish',
  'guitar', 'piano', 'bicycle', 'umbrella', 'computer', 'clock', 'hat', 'shoes', 'ball', 'camera', 'cake', 'bread', 'egg',
  'plane', 'boat', 'train', 'rocket', 'bus', 'truck', 'bridge', 'tower', 'rain', 'snow', 'star', 'moon', 'planet', 'ring',
  'glasses', 'watch', 'shirt', 'pants', 'skirt', 'dress', 'scarf', 'sock', 'glove', 'beach', 'forest', 'desert', 'lake',
  'park', 'zoo', 'library', 'museum', 'school', 'hospital', 'police', 'fire', 'chef', 'doctor', 'teacher', 'nurse',
  'police officer', 'firefighter', 'artist', 'scientist', 'engineer', 'dentist', 'veterinarian', 'singer', 'dancer',
  'actor', 'director', 'writer', 'painter', 'sculptor', 'architect', 'pilot', 'astronaut', 'chef', 'athlete', 'runner',
  'swimmer', 'diver', 'cyclist', 'skier', 'snowboarder', 'hiker', 'climber', 'sailor', 'surfer', 'golfer', 'fisherman',
  'robot', 'spaceship', 'alien', 'monster', 'ghost', 'vampire', 'witch', 'zombie', 'pirate', 'knight', 'princess', 'king',
  'queen', 'prince', 'wizard', 'dragon', 'castle', 'dungeon', 'sword', 'shield', 'helmet', 'armor', 'arrow', 'bow',
  'forest', 'jungle', 'savannah', 'volcano', 'island', 'reef', 'turtle', 'dolphin', 'whale', 'shark', 'octopus', 'crab',
  'lobster', 'seahorse', 'starfish', 'coral', 'fish', 'seal', 'penguin', 'walrus', 'polar bear', 'deer', 'elk', 'moose',
  'buffalo', 'bison', 'eagle', 'hawk', 'falcon', 'owl', 'bat', 'butterfly', 'moth', 'spider', 'ant', 'bee', 'wasp', 'fly',
  'mosquito', 'beetle', 'ladybug', 'grasshopper', 'cricket', 'locust', 'dragonfly', 'damselfly', 'firefly', 'flea',
  'tick', 'mite', 'scorpion', 'centipede', 'millipede', 'worm', 'snail', 'slug', 'clam', 'oyster', 'mussel', 'squid'
];
function getRandomWord() {
  return wordList[Math.floor(Math.random() * wordList.length)];
}

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/lobby.html');
});

app.get('/game', (req, res) => {
  res.sendFile(__dirname + '/public/game.html');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (username) => {
    const user = { id: socket.id, username, score: 0, hasDrawn: false };
    users.push(user);
    io.emit('user-list', users);

    if (users.length >= 3) {
      io.emit('waiting-lobby', { message: 'Starting game soon...' });
      setTimeout(() => {
        startGame();
      }, 5000);
    } else {
      io.emit('waiting-lobby', { message: `Waiting for players... ${users.length}/3` });
    }
  });

  socket.on('drawing', (data) => {
    socket.broadcast.emit('drawing', data);
  });

  socket.on('guess', (data) => {
    const user = users.find(user => user.id === socket.id);
    if (data.message.toLowerCase() === currentWord.toLowerCase()) {
      user.score += 10;
      io.emit('message', { username: data.username, isCorrect: true });
      nextTurn();
    } else {
      io.emit('message', { username: data.username, message: data.message });
    }
    io.emit('user-list', users);
  });

  socket.on('disconnect', () => {
    users = users.filter(user => user.id !== socket.id);
    io.emit('user-list', users);
  });

  socket.emit('current-state', {
    users,
    currentTurn,
    currentWord: '',
    hint: currentHint,
    timeLeft: roundDuration
  });
});

function startGame() {
  currentTurn = -1;
  nextTurn();
}

function nextTurn() {
  clearTimeout(timer);
  currentTurn = (currentTurn + 1) % users.length;
  if (users[currentTurn].hasDrawn) {
    currentTurn = (currentTurn + 1) % users.length;
  }
  const user = users[currentTurn];
  user.hasDrawn = true;
  currentWord = getRandomWord();
  currentHint = '_ '.repeat(currentWord.length);

  io.emit('new-turn', { user, word: currentWord, hint: currentHint });
  startTimer(roundDuration);
}

function startTimer(seconds) {
  let timeLeft = seconds;
  timer = setInterval(() => {
    timeLeft--;
    io.emit('start-timer', timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timer);
      nextTurn();
    }
  }, 1000);
}

server.listen(process.env.PORT || 4000;, () => {
  console.log('Server is running on port 3000');
});

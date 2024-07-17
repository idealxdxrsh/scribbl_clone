const socket = io();

document.getElementById('start-game').addEventListener('click', () => {
  const username = document.getElementById('username-input').value.trim();
  if (username) {
    socket.emit('join', username);
    window.location.href = '/game';
  }
});

socket.on('waiting-lobby', (data) => {
  const waitingLobby = document.getElementById('waiting-lobby');
  waitingLobby.style.display = 'block';
  waitingLobby.textContent = data.message;
});

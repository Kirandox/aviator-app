const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Import game logic and handlers if available, otherwise fallback to standard serving
app.get('/game', (req, res) => {
  res.sendFile(__dirname + '/app.js'); // Or serve your main game view
});

app.listen(PORT, () => {
  console.log('Sky Rocket server running successfully on port ' + PORT);
});

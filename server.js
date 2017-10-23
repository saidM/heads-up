'use strict'

const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

const Game = require('./lib/game')
const Deck = require('./lib/deck')
const Pot = require('./lib/pot')
const Player = require('./lib/player')

app.set('view engine', 'ejs')
  
let socket = null
const game = new Game()
game.start()

app.get('/', (req, res) => {
  const player = game.players.find(player => player.name === 'Player')
  const computer = game.players.find(player => player.name === 'Computer')

  if (req.query.action === 'fold') {
    game.emit('fold', 'Player')
  } else if (req.query.action === 'call') {
    game.emit('call', 'Player')
    
    // Computer action following the Player's call
    const random = Math.floor(Math.random() * (10 - 1 + 1)) + 1
    if (random > 2) {
      game.emit('raise', 'Computer', game.pot.total())
    } else {
      game.emit('fold', 'Computer')
    }
  } else if (req.query.action === 'raise') {
    game.emit('raise', 'Player', req.query.amount)

    // Computer action following the Player's raise
    const random = Math.floor(Math.random() * (10 - 1 + 1)) + 1
    if (random > 2) {
      game.emit('call', 'Computer')
    } else {
      game.emit('fold', 'Computer')
    }
  }

  if (game.winner !== null) {
    if (socket) socket.emit('end', game.winner)
    game.winner = null
  }

  if (player.chips <= 0) {
    return res.send('YOU LOST')
  }
  
  if (computer.chips <= 0) {
    return res.send('YOU WIN')
  }

  res.render('index.ejs', {chips: player.chips, computerChips: computer.chips, cards: player.cards, pot: game.pot, flop: game.flop, toCall: game.toCall, turn: game.turn, river: game.river})
})

server.listen(3000, '127.0.0.1')

io.on('connection', connection => {
  socket = connection
})
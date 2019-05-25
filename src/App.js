import React from 'react'
import './App.css'

import Socket from './utils/socket'

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      myId: '',
      myUsername: '',
      mySymbol: '',
      currentPlayer: 'O',
      gameStarted: false,
      playerOne: '',
      playerTwo: '',
      findingGame: false,
      creatingGame: false,
      board: {
        one: "", 
        two: "", 
        three: "", 
        four: "", 
        five: "", 
        six: "", 
        seven: "", 
        eight: "", 
        nine: ""
      }
    }

    Socket.emit('NEW_USER')

    Socket.on('GET_CURRENT_USER', user => {
      console.log('GET_CURRENT_USER returned: ', user)
      this.setState({ 
        myId: user.id,
        myUsername: user.username,
      })
    })

    Socket.on('RECEIVE_BROADCAST', response => {
      console.log(response)

      if (response.message == "tic-tac-toe-move") {
        if (response.played == undefined ) { return }
        if (response.username == this.state.myUsername) { return }
        if (response.username != this.state.myOpponent) { return }
        let currentBoard = this.state.board
        currentBoard[response.played] = this.state.currentPlayer
        this.setState({board: currentBoard})
      if (this.checkGame() !== "win") { this.changePlayer() }
      }

      if (response.message == "tic-tac-toe-connect") {
        if (!this.state.creatingGame) { return }
        this.setState({ 
          playerTwo: response.username,
          myOpponent: response.username,
          creatingGame: false,
          gameStarted: true,
        })

        const newConnectSuccess = {
          username: this.state.myUsername,
          message: "tic-tac-toe-connect-success",
          timestamp: Date.now(),
        }
      
        Socket.emit('BROADCAST_MESSAGE', newConnectSuccess)
      }

      if (response.message == "tic-tac-toe-connect-success") {
        if (!this.state.findingGame) { return }
        this.setState({ 
          playerOne: response.username,
          playerTwo: this.state.myUsername,
          myOpponent: response.username,
          findingGame: false,
          mySymbol: 'X',
          gameStarted: true,
        })
      }

    })





  }

  handleClick = e => {
    if (!this.state.gameStarted) { return }
    let selected = e.target.id
    if ((this.checkGame() !== "ongoing") || (this.state.board[selected] !== "")) { return }
    if (this.state.mySymbol != this.state.currentPlayer) { return }
    let currentBoard = this.state.board
    currentBoard[selected] = this.state.currentPlayer
    this.setState({board: currentBoard})
    if (this.checkGame() !== "win") { this.changePlayer() }

    const newMove = {
      username: this.state.myUsername,
      message: "tic-tac-toe-move",
      timestamp: Date.now(),
      played: selected,
    }
    Socket.emit('BROADCAST_MESSAGE', newMove)


  }

  handleCreate = () => {
    this.resetBoard()
    this.setState({ 
      playerOne: this.state.myUsername,
      playerTwo: '',
      mySymbol: 'O',
      creatingGame: true,
      findingGame: false,
      gameStarted: false,
    })
  }

  handleConnect = () => {
    this.resetBoard()
    this.setState({
      gameStarted: false,
      creatingGame: false,
      findingGame: true,
      playerOne: '',
      playerTwo: '',
      myOpponent: '',
    })

    const newConnect = {
      username: this.state.myUsername,
      message: "tic-tac-toe-connect",
      timestamp: Date.now(),
    }

    Socket.emit('BROADCAST_MESSAGE', newConnect)
  }

  isEqual = (x,y,z) => { if ((x !== "") && (x === y) && (x === z)) { return true } }

  checkGame = () => {
    let score = this.state.board
    if (this.isEqual(score.one,score.two,score.three)) { return "win" }
    else if (this.isEqual(score.one,score.four,score.seven)) { return "win" }
    else if (this.isEqual(score.one,score.five,score.nine)) { return "win" }
    else if (this.isEqual(score.two,score.five,score.eight)) { return "win" }
    else if (this.isEqual(score.three,score.five,score.seven)) { return "win" }
    else if (this.isEqual(score.three,score.six,score.nine)) { return "win" }
    else if (this.isEqual(score.four,score.five,score.six)) { return "win" }
    else if (this.isEqual(score.seven,score.eight,score.nine)) { return "win" }
    else if (this.checkDraw() === true) { return "draw" }
    else return "ongoing"
  }

  checkDraw = () => {
    let board = this.state.board
    for (let key in board) { if (board[key] === "") { return false } }
    return true
  }

  changePlayer = () => {
    if (this.state.currentPlayer === "O") { this.setState({currentPlayer: "X"}) }
    else this.setState({currentPlayer: "O"}) 
  }

  resetBoard = () => {
    let currentBoard = {one: "", two: "", three: "", four: "", five: "", six: "", seven: "", eight: "", nine: ""}
    this.setState({ board: currentBoard })
    this.setState({currentPlayer: "O"})
  }

  render() {
    let boardComponents = Object.keys(this.state.board).map(key =>
      <div onClick={this.handleClick} key={key} className='game-tile' id={key}>{this.state.board[key]}</div>
    )
    return (
    <React.Fragment>
      <div>
        <div>
          <p>Player One (O): {this.state.playerOne} {this.state.playerOne == this.state.myUsername && this.state.myUsername != '' ? '(You)' : null}</p>
          <p>Player Two (X): {this.state.playerTwo} {this.state.playerTwo == this.state.myUsername && this.state.myUsername != '' ? '(You)' : null}</p>
        </div>
        <button onClick={this.handleCreate} disabled={!this.state.myUsername}>Create a New Game</button>
        <button onClick={this.handleConnect} disabled={!this.state.myUsername}>Connect to a Game</button>
      </div>
      <div id="game-board">{boardComponents}</div>
      {/* <button className="reset" onClick={this.resetBoard}>RESET</button> */}
      { (this.checkGame() === "win") ? (<p className="message">WINNER: {(this.state.currentPlayer == "O")? this.state.playerOne:this.state.playerTwo}</p>) : null }
      { (this.checkGame() === "draw") ? (<p className="message">DRAW</p>) : null }
      { (this.checkGame() !== "win") && (this.checkGame() !== "draw") && (this.state.gameStarted === true) ? 
          <p className="message">
          {(this.state.currentPlayer == this.state.mySymbol)? `Your `:`${this.state.myOpponent}'s `}
          turn
          </p> : null 
      }
    </React.Fragment>
    )
  } 
}

export default App

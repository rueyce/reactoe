import React from 'react'
import './App.css'

import loading from './Ripple-1s-200px.gif' 

import { Button, Container, Row, Col } from 'reactstrap'

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
      findingGameFailed: false,
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
          findingGameFailed: false,
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
      findingGameFailed: false,
    })
  }

  handleConnect = () => {
    this.resetBoard()
    this.setState({
      gameStarted: false,
      creatingGame: false,
      findingGame: true,
      findingGameFailed: false,
      playerOne: '',
      playerTwo: '',
      myOpponent: '',
    })

    setTimeout(() => {
      if (this.state.findingGame) { 
        this.setState({ 
          findingGame: false,
          findingGameFailed: true,
        })
      }
    }, 5000)

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
    <Container fluid>
      <Row>
        <Col md="12" className="bg-dark d-flex py-4 justify-content-center align-items-center flex-column text-center">

        { !this.state.creatingGame && !this.state.findingGame && !this.state.findingGameFailed && !this.state.gameStarted ? 
          <div className="cursor-default">
            <p className="text-light lead my-0">PEPEGA Tic Tac Toe</p>
          </div>
          : null 
        }

        { this.state.creatingGame ? 
          <div className="cursor-default">
            <img src={loading} width="75" height="75"></img>
            <p className="text-light lead my-0">Waiting for an opponent...</p>
          </div>
          : null }

        { this.state.findingGame ? 
          <div className="cursor-default">
            <img src={loading} width="75" height="75"></img>
            <p className="text-light lead my-0">Finding game...</p>
          </div>
          : null 
        }

        { this.state.findingGameFailed ? 
            <p className="text-light lead my-0">No game found, create a new game yourself!</p>
          : null 
        }

        { this.state.gameStarted ?
          <div className="cursor-default">
            <p className="text-light lead my-0">Player One (O): {this.state.playerOne} {this.state.playerOne == this.state.myUsername && this.state.myUsername != '' ? '(You)' : null}</p>
            <p className="text-light lead my-0">Player Two (X): {this.state.playerTwo} {this.state.playerTwo == this.state.myUsername && this.state.myUsername != '' ? '(You)' : null}</p>
          </div>
        : null }

        </Col>  

        <Col md="12" className="">
      <div>
        <div className="mt-5 text-center">
          <button onClick={this.handleCreate} disabled={!this.state.myUsername} className="mr-3">Create a New Game</button>
          <button onClick={this.handleConnect} disabled={!this.state.myUsername}>Connect to a Game</button>
        </div>
      </div>
      <div id="game-board">{boardComponents}</div>
      {/* <button className="reset" onClick={this.resetBoard}>RESET</button> */}
      { (this.checkGame() === "win") ? (<p className="lead text-light text-center">WINNER: {(this.state.currentPlayer == "O")? this.state.playerOne:this.state.playerTwo}</p>) : null }
      { (this.checkGame() === "draw") ? (<p className="lead text-light text-center">DRAW</p>) : null }
      { (this.checkGame() !== "win") && (this.checkGame() !== "draw") && (this.state.gameStarted === true) ? 
          <p className="lead text-light text-center">
          {(this.state.currentPlayer == this.state.mySymbol)? `Your `:`${this.state.myOpponent}'s `}
          turn
          </p> : null 
      }
      </Col>
      </Row>
    </Container>
    )
  } 
}

export default App

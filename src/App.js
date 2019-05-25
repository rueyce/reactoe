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
      opponentSymbol: '',
      currentPlayer: 'O',
      gameStarted: false,
      playerOne: '',
      playerTwo: '',
      findingGame: false,
      creatingGame: false,
      findingGameFailed: false,
      board: ['','','','','','','','',''],
      hover: ['','','','','','','','',''],
    }

    Socket.emit('NEW_USER')

    Socket.on('GET_CURRENT_USER', user => {
      this.setState({ 
        myId: user.id,
        myUsername: user.username,
      })
    })

    Socket.on('RECEIVE_BROADCAST', response => {
      if (!response.tictactoe) { return }

      if (response.tictactoe.action === 'move') {
        if (response.tictactoe.played === undefined ) { return }
        if (response.tictactoe.target !== this.state.myUsername) { return }
        if (response.username !== this.state.myOpponent) { return }
        let board = [...this.state.board]
        board[response.tictactoe.played] = this.state.currentPlayer
        this.setState({ board })
      if (this.checkGame() === 'ongoing') { this.changePlayer() }
      }

      if (response.tictactoe.action === 'connect') {
        if (!this.state.creatingGame) { return }
        this.setState({ 
          playerTwo: response.username,
          myOpponent: response.username,
          creatingGame: false,
          gameStarted: true,
        })
        const gameAccept = {
          username: this.state.myUsername,
          message: this.getLorem(),
          timestamp: Date.now(),
          tictactoe: { action: 'connect-accept', target: response.username }
        }
        Socket.emit('BROADCAST_MESSAGE', gameAccept)
      }

      if (response.tictactoe.action === 'connect-accept') {
        if (!this.state.findingGame) { return }
        if (response.tictactoe.target !== this.state.myUsername) { return }
        this.setState({ 
          playerOne: response.username,
          playerTwo: this.state.myUsername,
          myOpponent: response.username,
          findingGame: false,
          mySymbol: 'X',
          opponentSymbol: 'O',
          gameStarted: true,
          findingGameFailed: false,
        })
      }

    })
  }

  getLorem = () => {
    const lorem = [
      'Lorem ipsum dolor sit amet.',
      'Consectetur adipiscing elit.',
      'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam.',
      'Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      'Excepteur sint occaecat cupidatat non proident.',
      'Sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
      'Totam rem aperiam.',
      'Eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
      'Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
      'Neque porro quisquam est.',
      'Qui dolorem ipsum quia dolor sit amet.',
      'Consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
      'Ut enim ad minima veniam.',
      'Quis nostrum exercitationem ullam corporis suscipit laboriosam.',
      'Nisi ut aliquid ex ea commodi consequatur?',
      'Vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
    ]
    return lorem[Math.floor(Math.random()*lorem.length)]
  }

  handleClick = (index) => {
    if (!this.state.gameStarted) { return }
    if (this.state.mySymbol !== this.state.currentPlayer) { return }
    if (this.checkGame() !== 'ongoing') { return }
    if (this.state.board[index] !== '') { return }
    const board = [...this.state.board]
    board[index] = this.state.currentPlayer
    this.setState({ board })
    if (this.checkGame() === 'ongoing') { this.changePlayer() }

    const gameMove = {
      username: this.state.myUsername,
      message: this.getLorem(),
      timestamp: Date.now(),
      tictactoe: { action: 'move', played: index, target: this.state.myOpponent }
    }
    Socket.emit('BROADCAST_MESSAGE', gameMove)

  }

  handleCreate = () => {
    this.resetBoard()
    this.setState({ 
      playerOne: this.state.myUsername,
      playerTwo: '',
      mySymbol: 'O',
      opponentSymbol: 'X',
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

    const gameConnect = {
      username: this.state.myUsername,
      message: this.getLorem(),
      timestamp: Date.now(),
      tictactoe: { action: 'connect' }
    }

    Socket.emit('BROADCAST_MESSAGE', gameConnect)
  }

  isEqual = (x,y,z) => { if ((x !== '') && (x === y) && (x === z)) { return true } }

  checkGame = () => {
    const score = this.state.board
    if (this.isEqual(score[0],score[1],score[2])) { return score[0] }
    else if (this.isEqual(score[0],score[3],score[6])) { return score[0] }
    else if (this.isEqual(score[0],score[4],score[8])) { return score[0] }
    else if (this.isEqual(score[1],score[4],score[7])) { return score[1] }
    else if (this.isEqual(score[2],score[4],score[6])) { return score[2] }
    else if (this.isEqual(score[2],score[5],score[8])) { return score[2] }
    else if (this.isEqual(score[3],score[4],score[5])) { return score[3] }
    else if (this.isEqual(score[6],score[7],score[8])) { return score[6] }
    else if (this.checkDraw() === true) { return 'draw' }
    else return 'ongoing'
  }

  testForColoring = () => {
    const score = this.state.board
    if (this.isEqual(score[0],score[1],score[2])) { return [0,1,2] }
    else if (this.isEqual(score[0],score[3],score[6])) { return [0,3,6] }
    else if (this.isEqual(score[0],score[4],score[8])) { return [0,4,8] }
    else if (this.isEqual(score[1],score[4],score[7])) { return [1,4,7] }
    else if (this.isEqual(score[2],score[4],score[6])) { return [2,4,6] }
    else if (this.isEqual(score[2],score[5],score[8])) { return [2,5,8] }
    else if (this.isEqual(score[3],score[4],score[5])) { return [3,4,5] }
    else if (this.isEqual(score[6],score[7],score[8])) { return [6,7,8] }
    else if (this.checkDraw() === true) { return 'draw' }
    else return 'ongoing'
  }

  checkDraw = () => {
    let score = this.state.board
    for (let i = 0; i < score.length; i++) { if (score[i] === '') { return false } }
    return true
  }

  changePlayer = () => {
    if (this.state.currentPlayer === 'O') { this.setState({currentPlayer: 'X'}) }
    else this.setState({currentPlayer: 'O'}) 
  }

  resetBoard = () => {
   this.setState({ 
     board: ['','','','','','','','',''],
     currentPlayer: 'O',
    })
  }

  mouseEnter = (index) => {
    if (!this.state.gameStarted) { return }
    if (this.state.mySymbol !== this.state.currentPlayer) { return }
    if (this.state.board[index] !== '') { return }
    const hover = ['','','','','','','','','']
    hover[index] = this.state.mySymbol
    this.setState({ hover })
  }

  mouseLeave = (index) => {
    const hover = [...this.state.hover]
    hover[index] = ''
    this.setState({ hover })    
  }


  render() {

    let boardComponents = this.state.board.map((box, index) => {

      let spanClass = "lead display-3 font-weight-bold "
      if (this.state.board[index] === 'O') { spanClass += "text-playerone " }
      else { spanClass += "text-playertwo "}
      if (this.testForColoring().indexOf(index) !== -1) { spanClass += "winning-combo-bois " }

      let divClass = "game-tile "
      if (index !== 6 && index !== 7 && index !== 8) { divClass += "border-tac-bottom " }
      if (index !== 2 && index !== 5 && index !== 8) { divClass += "border-tac-right " }
      if (this.testForColoring().indexOf(index) !== -1) { divClass += "winning-combo-lads " }

      return (
        <div 
          key={index} 
          className={divClass}
          onClick={() => this.handleClick(index)} 
          onMouseEnter={() => this.mouseEnter(index)}
          onMouseLeave={() => this.mouseLeave(index)}
        >
          {this.state.board[index] !== '' ? 
            <span className={spanClass}>{this.state.board[index]}</span> :
            <span className="lead display-3 font-weight-bold text-playerhover">{this.state.hover[index]}</span>
          }
        </div>
      )})

    return (
    <Container fluid>
      <Row>
        <Col md="12" className="bg-dark d-flex py-4 justify-content-center align-items-center flex-column text-center cursor-default">

        { !this.state.creatingGame && !this.state.findingGame && !this.state.findingGameFailed && !this.state.gameStarted ? 
          <div className="cursor-default">
            <p className="text-light lead my-0">PEPEGA Tic Tac Toe</p>
          </div>
          : null }

        { this.state.creatingGame ? 
          <React.Fragment>
            <img src={loading} alt="Create-Loader" width="75" height="75"></img>
            <p className="text-light lead my-0">Waiting for an opponent...</p>
          </React.Fragment>
          : null }

        { this.state.findingGame ? 
          <React.Fragment>
            <img src={loading} alt="Find-Loader" width="75" height="75"></img>
            <p className="text-light lead my-0">Finding game...</p>
          </React.Fragment>
          : null }

        { this.state.findingGameFailed ? 
            <p className="text-light lead my-0">Unable to find game, create one yourself!</p>
          : null }

        { this.state.gameStarted ?
          <React.Fragment>
            <p className="text-light lead my-0">Player One (O): {this.state.playerOne} {this.state.playerOne === this.state.myUsername && this.state.myUsername !== '' ? '(You)' : null}</p>
            <p className="text-light lead mt-0 mb-3">Player Two (X): {this.state.playerTwo} {this.state.playerTwo === this.state.myUsername && this.state.myUsername !== '' ? '(You)' : null}</p>

            { this.checkGame() === this.state.mySymbol ? 
              <p className="lead text-light text-center my-0">You won!</p> 
              : null }

            { this.checkGame() === this.state.opponentSymbol ? 
              <p className="lead text-light text-center my-0">You lost!</p>
              : null } 

            { this.checkGame() === 'draw' ? 
              <p className="lead text-light text-center my-0">It's a draw!</p> 
              : null }
            { this.checkGame() === 'ongoing' && this.state.gameStarted === true ? 
              <p className="lead text-light text-center my-0">
                { this.state.currentPlayer === this.state.mySymbol ? 
                  "It's your turn." : 
                  `Waiting for ${this.state.myOpponent}'s move.`}
              </p> : null }
          </React.Fragment>
        : null }

        </Col>  

        <Col md="12" className="">
          <div>
            <div className="mt-4 pt-2 text-center">
              <Button color="success" onClick={this.handleCreate} disabled={!this.state.myUsername || this.state.creatingGame || this.state.findingGame} className="mr-3">Create a New Game</Button>
              <Button color="primary" onClick={this.handleConnect} disabled={!this.state.myUsername || this.state.findingGame}>Connect to a Game</Button>
            </div>
          </div>
          <div id="game-board">{boardComponents}</div>
        </Col>
      </Row>
    </Container>
    )
  } 
}

export default App

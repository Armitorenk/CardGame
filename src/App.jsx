import { useState, useEffect, useRef } from 'react'
import './App.css'

const suits = ['H', 'D', 'C', 'S']
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']

function getCardImageUrl(rank, suit) {
  const r = rank === '10' ? '0' : rank
  return `https://deckofcardsapi.com/static/img/${r}${suit}.png`
}

function getCardBackUrl() {
  return `https://deckofcardsapi.com/static/img/back.png`
}

function hasMatchingPair(groups) {
  const topRanks = groups.filter(g => g.length > 0).map(g => g[0].rank)
  const seen = new Set()
  for (const r of topRanks) {
    if (seen.has(r)) return true
    seen.add(r)
  }
  return false
}

function isGameOver(groups) {
  return groups.every(g => g.length === 0)
}

function buildSafeGroups() {
  const deck = []
  ranks.forEach(rank => {
    suits.forEach(suit => {
      deck.push({ suit, rank, id: `${suit}-${rank}-${Math.random()}` })
    })
  })

  const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  let attempts = 0
  while (attempts < 1000) {
    const shuffled = shuffle(deck)
    const groups = Array.from({ length: 13 }, (_, i) =>
      shuffled.slice(i * 4, i * 4 + 4)
    )
    if (hasMatchingPair(groups)) return groups
    attempts++
  }

  const shuffled = shuffle(deck)
  const groups = Array.from({ length: 13 }, (_, i) =>
    shuffled.slice(i * 4, i * 4 + 4)
  )
  const rank0 = groups[0][0].rank
  const matchIdx = groups[1].findIndex(c => c.rank === rank0)
  if (matchIdx > 0) {
    [groups[1][0], groups[1][matchIdx]] = [groups[1][matchIdx], groups[1][0]]
  }
  return groups
}

function reshuffleTopCards(currentGroups) {
  const allCards = currentGroups.flat()
  const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const nonEmptyIndices = currentGroups.reduce((acc, g, i) => {
    if (g.length > 0) acc.push(i)
    return acc
  }, [])
  const sizes = nonEmptyIndices.map(i => currentGroups[i].length)

  let attempts = 0
  while (attempts < 500) {
    const shuffled = shuffle(allCards)
    const newGroups = currentGroups.map(g => [...g])
    let cursor = 0
    nonEmptyIndices.forEach((gi, ni) => {
      newGroups[gi] = shuffled.slice(cursor, cursor + sizes[ni])
      cursor += sizes[ni]
    })
    if (hasMatchingPair(newGroups)) return newGroups
    attempts++
  }
  return currentGroups
}

function App() {
  const [groups, setGroups] = useState([])
  const [revealed, setRevealed] = useState(Array(13).fill(false))
  const [selected, setSelected] = useState([])
  const [moves, setMoves] = useState(0)
  const [isWon, setIsWon] = useState(false)
  const [animations, setAnimations] = useState(Array(13).fill(null))
  const [warning, setWarning] = useState(false)
  const locked = useRef(false)

  const initGame = () => {
    const newGroups = buildSafeGroups()
    setGroups(newGroups)
    setRevealed(Array(13).fill(false))
    setSelected([])
    setMoves(0)
    setIsWon(false)
    setAnimations(Array(13).fill(null))
    setWarning(false)
    locked.current = false
  }

  useEffect(() => { initGame() }, [])

  const handleClick = (idx) => {
    if (locked.current) return
    if (!groups[idx] || groups[idx].length === 0) return
    if (revealed[idx]) return
    if (selected.includes(idx)) return

    const newRevealed = [...revealed]
    newRevealed[idx] = true
    setRevealed(newRevealed)

    const newSelected = [...selected, idx]
    setSelected(newSelected)

    if (newSelected.length === 2) {
      locked.current = true
      const [a, b] = newSelected
      setMoves(prev => prev + 1)

      if (groups[a][0].rank === groups[b][0].rank) {
        setTimeout(() => {
          const newAnim = [...animations]
          newAnim[a] = 'match'
          newAnim[b] = 'match'
          setAnimations(newAnim)

          setTimeout(() => {
            const updatedGroups = groups.map((g, i) =>
              i === a || i === b ? g.slice(1) : g
            )
            setGroups(updatedGroups)
            setRevealed(Array(13).fill(false))
            setSelected([])
            setAnimations(Array(13).fill(null))

            if (isGameOver(updatedGroups)) {
              setIsWon(true)
              locked.current = false
              return
            }

            if (!hasMatchingPair(updatedGroups)) {
              const reshuffled = reshuffleTopCards(updatedGroups)
              setGroups(reshuffled)
              setWarning(true)
              setTimeout(() => setWarning(false), 2500)
            }

            locked.current = false
          }, 880)
        }, 620)
      } else {
        const newAnim = [...animations]
        newAnim[a] = 'mismatch'
        newAnim[b] = 'mismatch'
        setAnimations(newAnim)

        setTimeout(() => {
          const flipBack = [...newAnim]
          flipBack[a] = 'flipback'
          flipBack[b] = 'flipback'
          setAnimations(flipBack)

          const resetRev = [...newRevealed]
          resetRev[a] = false
          resetRev[b] = false
          setRevealed(resetRev)

          setTimeout(() => {
            setSelected([])
            setAnimations(Array(13).fill(null))
            locked.current = false
          }, 650)
        }, 900)
      }
    }
  }

  return (
    <div className="container">
      <h2>Playing Cards Matching Game</h2>
      <div className="header">
        <span>Moves: {moves}</span>
        {warning && <span className="warning">♻️ Cards reshuffled — no match was available!</span>}
        <button className="restart-btn" onClick={initGame}>Restart</button>
      </div>

      <div className="board">
        {groups.map((group, idx) => {
          const card = group[0]
          const isRevealed = revealed[idx]
          const anim = animations[idx]

          if (!card) return <div key={idx} className="slot empty" />

          return (
            <div key={idx} className="slot">
              <div
                className={[
                  'card',
                  isRevealed ? 'flipped' : '',
                  anim === 'mismatch' ? 'shake' : '',
                  anim === 'flipback' ? 'flipback' : '',
                  anim === 'match' ? 'matchremove' : ''
                ].filter(Boolean).join(' ')}
                onClick={() => handleClick(idx)}
              >
                <div className="card-face card-back">
                  <img src={getCardBackUrl()} alt="card back" draggable={false} />
                </div>
                <div className="card-face card-front">
                  <img
                    src={getCardImageUrl(card.rank, card.suit)}
                    alt={`${card.rank} of ${card.suit}`}
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isWon && (
        <div className="overlay">
          <div className="win-box">
            <h3>Congratulations! 🎉</h3>
            <p>Total Moves: {moves}</p>
            <button onClick={initGame}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
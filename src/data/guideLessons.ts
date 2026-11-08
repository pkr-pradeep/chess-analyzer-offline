export interface GuideLesson {
  id: string;
  title: string;
  subtitle: string;
  bookCitation: string;
  theme: string;
  fen?: string;
  sampleMoves?: string[];
  puzzleThemeLink?: string;
  content: string[];
  keyRules: string[];
  quote?: string;
  quoteAuthor?: string;
}

export interface GuideChapter {
  id: string;
  title: string;
  author: string;
  tagline: string;
  iconName: string;
  lessons: GuideLesson[];
}

export const CHESS_GUIDE_CHAPTERS: GuideChapter[] = [
  // CHAPTER 1: TACTICS & COMBINATIONS
  {
    id: 'ch-tactics',
    title: 'The ABC of Tactics & Combinations',
    author: 'Dr. Dave Regis & Dan Heisman',
    tagline: 'Short, violent lessons on forks, pins, skewers, jumps, and why games are lost',
    iconName: 'Swords',
    lessons: [
      {
        id: 'regis-3-reasons',
        title: 'The Three Most Common Reasons Games Are Lost',
        subtitle: 'Accidents vs Clever Play & Dan Heisman LPDO',
        bookCitation: 'Dr. Dave Regis: Tactics and Combinations (p. 10) & Dan Heisman: Back to Basics Tactics',
        theme: 'hanging_piece',
        fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5',
        sampleMoves: ['Nxe4', 'd5', 'Bd3'],
        puzzleThemeLink: 'fork',
        content: [
          'The three most common reasons games are lost between learning players have little to do with esoteric theory. They are accidents, oversights, and careless moves:',
          '1. You lose a piece for nothing (hanging piece).',
          '2. You lose a piece for a less important piece or pawn.',
          '3. Your piece is outnumbered: there are more attackers than defenders.',
          'Grandmaster John Nunn famously dubbed this "LDPO" (or LPDO): Loose Pieces Drop Off! When a piece has no defenders, it is an accident waiting to happen.'
        ],
        keyRules: [
          'LPDO Rule: Before making any move, ask: "Are any of my pieces undefended?"',
          'Count attackers vs defenders on every contested square.',
          'Never trade a more valuable piece for a less valuable one without clear dynamic compensation.'
        ],
        quote: 'I thought I would see lots of advanced strategic concepts, but actually all I have learnt is LPDO: Loose Pieces Drop Off.',
        quoteAuthor: 'GM John Nunn',
      },
      {
        id: 'regis-forks',
        title: 'Forks & Double Attacks',
        subtitle: 'Striking Two Targets with a Single Blow',
        bookCitation: 'Dr. Dave Regis: Tactics and Combinations (p. 13-15)',
        theme: 'fork',
        fen: 'r3k2r/ppp3pp/2n1q3/3N1p2/8/3P1N2/PPP1QPPP/R4RK1 w kq - 0 12',
        sampleMoves: ['Nxc7+', 'Kd7', 'Nxe6'],
        puzzleThemeLink: 'fork',
        content: [
          'A fork occurs when one piece attacks two or more enemy pieces simultaneously. Because an opponent can only make one move at a time, one of the attacked pieces is usually captured.',
          'Knights are the most cunning forking pieces because their jumping geometry allows them to attack heavy pieces (Kings, Queens, Rooks) without being counter-attacked.',
          'Queens are the second most lethal forking piece due to their long-range diagonal and linear reach (e.g. ancient Qa4+ checks King and takes loose knight on e4).'
        ],
        keyRules: [
          'Look for enemy pieces that share the same rank, file, or diagonal reachable by your knight or queen.',
          'The "Family Fork" (checking King and attacking Queen/Rook simultaneously) wins the game on the spot.',
          'Pawn forks (like ...d5 in the Italian or Two Knights) win central space and free piece play.'
        ],
        quote: 'Beginners love the knight fork because it wins a Rook for a Knight, or for nothing at all!',
        quoteAuthor: 'Dr. Dave Regis',
      },
      {
        id: 'regis-pins',
        title: 'Pins & Counter-Pins',
        subtitle: 'Immobilizing Pieces Against the King or Queen',
        bookCitation: 'Dr. Dave Regis: Tactics and Combinations (p. 16-18)',
        theme: 'pin',
        fen: 'r1b1k2r/ppp1bppp/5nn1/3PN1B1/3Q4/2P5/PP2BPPP/RN2K2R w KQkq - 0 10',
        sampleMoves: ['Ng4', 'O-O', 'Nxf6+'],
        puzzleThemeLink: 'pin',
        content: [
          'A pin occurs when an attacking piece targets an enemy piece that cannot move without exposing a more valuable piece behind it.',
          'Absolute Pin: The piece behind is the King. By FIDE Article 3.9, the pinned piece is legally forbidden from moving!',
          'Relative Pin: The piece behind is the Queen or Rook. Moving it is legal, but catastrophic.',
          'Siegbert Tarrasch’s Rule: Pinned pieces cannot run away. Instead of rushing to capture it immediately, pile on another attacker (poking the pinned piece again)!'
        ],
        keyRules: [
          'Poking the Pin: If an enemy piece is pinned, bring up pawns or minor pieces to attack it again.',
          'Beware of Counter-Pins: When pinning an opponent piece, check that your pinning piece is not itself pinned!',
          'Unpin quickly: If your piece is pinned against your King, break the pin immediately with a bishop or move the King.'
        ],
        quote: 'The pin is mightier than the sword.',
        quoteAuthor: 'Fred Reinfeld',
      },
      {
        id: 'regis-skewers',
        title: 'Skewers & X-Ray Attacks',
        subtitle: 'Reaching Through a Heavy Piece to Take What Lies Behind',
        bookCitation: 'Dr. Dave Regis: Tactics and Combinations (p. 19)',
        theme: 'skewer',
        fen: 'r2qkb1r/ppp3pp/3p4/4nb2/4q3/4NN2/PPP1BPPP/R1BQK2R w KQkq - 0 10',
        sampleMoves: ['Bd3', 'Qb4+', 'c3'],
        puzzleThemeLink: 'skewer',
        content: [
          'A skewer is often called a "reverse pin". The more valuable piece (King or Queen) is in front, and a less valuable or undefended piece is behind it on the same line.',
          'When the valuable piece is attacked, it is forced to move away, leaving the target behind it open to slaughter.',
          'Bishops and Rooks are the primary executioners of skewers across open files, ranks, and diagonals.'
        ],
        keyRules: [
          'Look for Kings and Queens aligned on open diagonals with unprotected rooks or bishops behind them.',
          'In endgames, Rook skewers along ranks or files frequently decide pawn races.'
        ]
      },
      {
        id: 'regis-discoveries',
        title: 'Jumps, Discoveries & Unmasking',
        subtitle: 'The Deadliest Tactic: The Threat Behind the Moving Piece',
        bookCitation: 'Dr. Dave Regis: Tactics and Combinations (p. 23-28)',
        theme: 'jump_discovery',
        fen: 'r3kb1r/ppp2ppp/2n5/3qP3/4N3/5Q2/PPP2PPP/R1B1K2R w KQkq - 0 10',
        sampleMoves: ['Nf6+', 'gxf6', 'Qxd5'],
        puzzleThemeLink: 'jump_discovery',
        content: [
          'Discovered attacks occur when a piece moves out of the way, unmasking an attack from a friendly rook, bishop, or queen behind it.',
          'Because the moving piece can jump to any square—even with a check or threat—it creates a two-pronged crisis that opponents often overlook.',
          'Double Check: When the moving piece AND the unmasked piece both deliver check simultaneously. The King MUST move; it cannot block or capture both checking pieces!'
        ],
        keyRules: [
          'Double check is the most destructive weapon in chess: the King has no choice but to run.',
          'The danger comes from the hidden piece behind the one that moves.',
          'Windmill / Mill: A repeated series of discovered checks that eats the entire enemy army (e.g. Torre vs Lasker 1925).'
        ],
        quote: 'Jumps are the type of tactic that is most often overlooked, because the danger comes from the hidden piece behind.',
        quoteAuthor: 'Dr. Dave Regis',
      },
      {
        id: 'regis-advanced-combos',
        title: 'Two-Move Ideas: Undermining, Overloading & Decoys',
        subtitle: 'Removing Guards, Deflecting Defenders, and Interference',
        bookCitation: 'Dr. Dave Regis: Tactics and Combinations (p. 29-34)',
        theme: 'undermining',
        fen: 'r3k1nr/ppp2ppp/2n5/8/1b1q4/2N2B2/PP2BPPP/R1BQK2R w KQkq - 0 10',
        sampleMoves: ['Bxc6+', 'bxc6', 'Qxd4'],
        puzzleThemeLink: 'undermining',
        content: [
          'Combinations are born when two simple ideas combine in sequence:',
          '• Undermining (Removing the Guard): Capture or chase away the single piece that is protecting a valuable square or piece.',
          '• Overloading: Identify an enemy piece that has two defensive duties at once, then force it to choose which one to abandon.',
          '• Interference: Place a pawn or piece between two defending enemy pieces, breaking their line of sight.',
          '• Decoy: Force the opponent King or Queen onto a fatal square where they fall victim to a fork or checkmate.',
          '• Zwischenzug (Intermezzo): Insert an unexpected intermediate check or threat before carrying out the recapture!'
        ],
        keyRules: [
          'If an opponent piece defends two things at once, attack one to win the other.',
          'Check for intermediate moves (Zwischenzug) before playing automatic recaptures.'
        ],
        quote: 'Combinations are the heart of chess.',
        quoteAuthor: 'Alexander Alekhine',
      }
    ]
  },

  // CHAPTER 2: STRATEGY & THE CENTRE
  {
    id: 'ch-strategy',
    title: 'The Centre, Harmony & Prophylaxis',
    author: 'Boroljub Zlatanovic & Irving Chernev',
    tagline: 'Why dominating the centre controls both flanks and how to coordinate minor pieces',
    iconName: 'Crown',
    lessons: [
      {
        id: 'zlatanovic-centre',
        title: 'The Golden Principle of Centralisation',
        subtitle: 'Why Control Over the Centre Dictates Flank Success',
        bookCitation: 'Boroljub Zlatanovic: Fundamental Chess Strategy in 100 Games (p. 9-13)',
        theme: 'endgame',
        fen: 'r2r2k1/2Rn1pp1/p4n1p/1p2N3/3P1PP1/3BK3/PP5P/2R5 w - - 0 19',
        sampleMoves: ['g4', 'h6', 'f4', 'Be8', 'g5'],
        puzzleThemeLink: 'endgame',
        content: [
          'Why is the centre so important? A piece in the centre (e4, d4, e5, d5) controls up to four times as many squares as a piece on the rim or in the corner.',
          'Furthermore, centrally placed pieces can rapidly swing to attack either the kingside or the queenside in a single move.',
          'Boroljub Zlatanovic’s Golden Rule: "If the opponent neglects centralisation, just improve yours! Never forget about the centre and never go for a flank attack if your centre is not secured!"',
          'In Rubinstein vs Schlechter (1912), White dominated the centre with Bb5! and Ke3!, restricting Black to passive flank moves before delivering a crushing breakthrough.'
        ],
        keyRules: [
          'A flank attack without central control is doomed to fail.',
          'Keep your King centralized in endgames: the King is an attacking piece when queens are off!',
          'Dominate the 4 central squares: e4, d4, e5, d5.'
        ],
        quote: 'Strategy without tactics is the slowest route to victory. Tactics without strategy is the noise before defeat.',
        quoteAuthor: 'Sun Tzu / Quoted in Fundamental Chess Strategy',
      },
      {
        id: 'zlatanovic-harmony',
        title: 'Piece Coordination & Colour Harmony',
        subtitle: 'The Synergy of Knights, Bishops, and Pawns',
        bookCitation: 'Boroljub Zlatanovic: Fundamental Chess Strategy in 100 Games (p. 21, 27)',
        theme: 'endgame',
        fen: '2r1rnk1/pb1nbpp1/1pp1p2p/q1PpN3/NP1Pn3/3B2PP/PB2PP1R/3R2K1 b - - 0 24',
        sampleMoves: ['Qxa4', 'Nxa4', 'Ne4'],
        content: [
          'Harmony means your pieces work together towards a single purpose rather than stepping on each other’s toes.',
          'Zlatanovic’s famous color principle: "Pawns and knights should stay on squares of the same colour, and bishops on opposite ones."',
          'When pawns and knights occupy the same color squares, they control both light and dark squares in unison, and the pawns protect the knights against enemy pieces.',
          'Avoid "knights on the rim": as Siegbert Tarrasch noted, "A knight on the rim is dim (or grim)".'
        ],
        keyRules: [
          'Place knights on central outposts supported by pawns (e4, d4, e5, d5, c4, c5).',
          'Do not lock your own bishops behind your own fixed pawns of the same color.',
          'Place rooks on open files and aim for the 7th rank.'
        ],
        quote: 'Pawns and knights should stay on squares of the same colour, and bishops on opposite ones.',
        quoteAuthor: 'Boroljub Zlatanovic',
      },
      {
        id: 'zlatanovic-prophylaxis',
        title: 'Prophylaxis & Karpovian Technique',
        subtitle: 'Preventing Opponent Counterplay Before It Happens',
        bookCitation: 'Boroljub Zlatanovic: Fundamental Chess Strategy in 100 Games (p. 14-18, Karpov vs Seirawan)',
        theme: 'endgame',
        fen: 'r2r4/pp1bkppp/2n1pn2/8/2BN4/2N1P3/PP2KPPP/R2R4 w - - 0 14',
        sampleMoves: ['Rhd1', 'a5', 'Rac1'],
        content: [
          'Prophylaxis is the art of anticipating what your opponent wants to do and quietly stopping it before advancing your own plans.',
          'In Karpov vs Seirawan (1989), Anatoly Karpov built incremental positional pressure by denying Seirawan active squares for his rooks and knights.',
          'Before playing your intended move, always ask: "What does my opponent want to play on their next turn? Can I shut it down with tempo?"'
        ],
        keyRules: [
          'Never rush: patience and restriction win more games than reckless attacks.',
          'Fix enemy weaknesses on color complexes where your pieces dominate.',
          'Trade pieces when ahead in material; keep pieces on the board when attacking.'
        ],
        quote: 'Karpov always played superbly in positions with a small but stable positional advantage.',
        quoteAuthor: 'Boroljub Zlatanovic',
      }
    ]
  },

  // CHAPTER 3: OPENING PRINCIPLES
  {
    id: 'ch-openings',
    title: 'The Golden Rules of the Opening',
    author: 'GM John Emms & Pete Tamburro',
    tagline: 'Discovering chess openings: how to start every game safely and actively',
    iconName: 'Compass',
    lessons: [
      {
        id: 'emms-golden-rules',
        title: 'The 4 Golden Rules of Chess Openings',
        subtitle: 'The Universal Opening Blueprint for All Players',
        bookCitation: 'GM John Emms: Discovering Chess Openings & Pete Tamburro: Openings for Amateurs',
        theme: 'hanging_piece',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5',
        sampleMoves: ['d6', 'c3', 'O-O'],
        content: [
          'Opening theory exists for one reason: to reach a healthy, active middle game safely. GM John Emms outlines the four golden laws:',
          '1. Stake a claim in the centre on move 1 (1.e4 or 1.d4; respond with 1...e5, 1...c5, or 1...d5).',
          '2. Develop minor pieces rapidly: Knights before Bishops! Knights find natural squares on f3/c3 or f6/c6.',
          '3. Castle early (usually within the first 6 to 8 moves) to tuck the King away safely and connect the Rooks.',
          '4. Do not move the same piece twice without a compelling tactical reason, and DO NOT bring the Queen out early!'
        ],
        keyRules: [
          'Develop with threats whenever possible to gain tempi.',
          'Do not go pawn hunting with your Queen while your minor pieces sleep on the back rank.',
          'Castle before launching any major attack.'
        ],
        quote: 'Every move in the opening should be a developing move or fight for the centre.',
        quoteAuthor: 'GM John Emms',
      },
      {
        id: 'emms-popular-openings',
        title: 'Survey of Classic Openings',
        subtitle: 'Italian, Ruy Lopez, French, and Queen’s Gambit',
        bookCitation: 'Pete Tamburro: Openings for Amateurs & Dr. Dave Regis Opening Index',
        theme: 'endgame',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3',
        sampleMoves: ['Bc5', 'c3', 'Nf6', 'd3'],
        content: [
          '• Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4): Targets the tender f7 square right from move 3. Ideal for learning piece development and attacking plans.',
          '• Ruy Lopez / Spanish (1.e4 e5 2.Nf3 Nc6 3.Bb5): Puts indirect pressure on the e5 pawn by attacking its defender on c6.',
          '• Sicilian Defense (1.e4 c5): An asymmetric, dynamic counter-attack fighting for the d4 square with a flank pawn.',
          '• French Defense (1.e4 e6 2.d4 d5): Solid, resilient pawn chain with counter-attacks against White’s d4 pawn base.',
          '• Queen’s Gambit (1.d4 d5 2.c4): White offers a wing pawn to seize central superiority.'
        ],
        keyRules: [
          'Pick 1-2 reliable openings for White and Black and master the key ideas rather than memorizing engine lines.',
          'Understand pawn structures: the pawns dictate where your pieces belong.'
        ]
      }
    ]
  },

  // CHAPTER 4: ATTACKING PLANS & CHECKMATE PATTERNS
  {
    id: 'ch-attacks',
    title: 'Simple Attacking Plans & Checkmate Patterns',
    author: 'Fred Wilson & Irving Chernev',
    tagline: 'Defeating uncastled kings, exploiting f7, and legendary mating nets',
    iconName: 'Flame',
    lessons: [
      {
        id: 'wilson-f7-weakness',
        title: 'The Vulnerability of f7 & f2',
        subtitle: 'Why the Uncastled King Falls to Quick Checkmates',
        bookCitation: 'Fred Wilson: Simple Attacking Plans & Dr. Dave Regis (p. 51-54)',
        theme: 'mate',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
        sampleMoves: ['Qxf7#'],
        puzzleThemeLink: 'mate',
        content: [
          'At the start of the game, f7 (for Black) and f2 (for White) is the weakest square on the board because it is protected ONLY by the King!',
          'Scholar’s Mate: 1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6?? 4.Qxf7#.',
          'Even if your opponents know how to defend against Scholar’s Mate with ...g6 and ...Nf6, the motif of attacking f7 recurs across the Italian Game, Fried Liver Attack, and King’s Gambit.',
          'When the King is driven into the open, a "King Hunt" ensues where every check drives him closer to doom.'
        ],
        keyRules: [
          'Never play ...f6 or f3 casually: weakening the e8-h5 / e1-h4 diagonal invites instant catastrophe.',
          'Castle quickly to put a Rook on f8/f1 to defend the f-pawn.',
          'If your opponent’s king gets stuck in the center, open the central files with pawn breaks immediately!'
        ],
        quote: 'The square f7 is the Achilles heel of the chess army.',
        quoteAuthor: 'Fred Wilson',
      },
      {
        id: 'wilson-mating-patterns',
        title: 'Hall of Fame Checkmate Patterns',
        subtitle: 'Smothered Mate, Legall’s Mate, Boden’s Mate & Greek Gift',
        bookCitation: 'Fred Wilson: Simple Attacking Plans & Dr. Dave Regis (p. 55-69)',
        theme: 'smothered_mate',
        fen: 'r1b1k2r/ppp1bpp1/2n3p1/4NN2/3Pn3/8/PPP2PPP/R1BQR1K1 w kq - 0 8',
        sampleMoves: ['Qd5', 'Rf8', 'Ng7#'],
        puzzleThemeLink: 'smothered_mate',
        content: [
          'Mastering these classic checkmate patterns will help you spot mating threats in your own games:',
          '• Smothered Mate: A knight jumps into the corner against a king completely blocked by his own rooks and pawns.',
          '• Legall’s Mate: Sacrificing the Queen to deliver checkmate with two active knights and a bishop against the uncastled King.',
          '• Boden’s Mate: Two cross-cutting bishops slice through a queenside-castled king.',
          '• The Greek Gift Sacrifice (Bxh7+!): Sacrificing the bishop to drag the enemy king into the open followed by Ng5+ and Qh5.'
        ],
        keyRules: [
          'When an enemy King has no luft (escape square), look for forcing sacrifices.',
          'A Queen sacrifice is justified if it leads to forced checkmate in 2-3 moves.'
        ]
      }
    ]
  },

  // CHAPTER 5: ENDGAME ESSENTIALS
  {
    id: 'ch-endgames',
    title: 'Endgame Precision & Conversion',
    author: 'Dr. Karsten Müller & Yasser Seirawan',
    tagline: 'Opposition, the square rule, Lucena bridge building, and king activity',
    iconName: 'Shield',
    lessons: [
      {
        id: 'muller-opposition',
        title: 'The Opposition & The Square Rule',
        subtitle: 'The Mathematical Foundations of Pawn Endgames',
        bookCitation: 'Dr. Karsten Müller: Chess Endgames for Kids & Yasser Seirawan: Winning Chess Endings',
        theme: 'endgame',
        fen: '8/8/4k3/8/4K3/8/4P3/8 w - - 0 1',
        sampleMoves: ['Kd4', 'Kd6', 'e4', 'Ke6', 'e5'],
        puzzleThemeLink: 'endgame',
        content: [
          'In King and Pawn endgames, two rules reign supreme:',
          '1. The Opposition: When Kings stand face-to-face separated by an odd number of squares on the same rank or file. The player whose turn it is to move must yield ground ("give up the opposition").',
          '2. The Rule of the Square: Draw a square from the passed pawn to the promotion rank. If the defending King is outside this square and cannot step into it, the pawn promotes without help!'
        ],
        keyRules: [
          'Keep your King in front of your passed pawn to pave the way.',
          'Seize the opposition to push the enemy King aside.',
          'Activate your King: In endgames, the King is worth 4 points of fighting power!'
        ]
      },
      {
        id: 'muller-lucena',
        title: 'The Lucena & Philidor Positions',
        subtitle: 'The Two Most Critical Rook Endgames Every Player Must Know',
        bookCitation: 'Dr. Karsten Müller: Chess Endgames for Kids',
        theme: 'endgame',
        fen: '1K1R4/1P3k2/8/8/8/8/7r/8 w - - 0 1',
        sampleMoves: ['Rd4', 'Ke7', 'Kc7', 'Rc2+', 'Kb6', 'Rb2+', 'Kc6'],
        puzzleThemeLink: 'endgame',
        content: [
          'Rook endgames make up over 50% of all chess endings! Two positions must be memorized:',
          '• Lucena Position (Winning): You have a pawn on the 7th rank and your king in front. Move your Rook to the 4th rank (1.Rd4!), then step your King out. When the opponent checks, shield your King by blocking on the 4th rank ("building a bridge").',
          '• Philidor Defense (Drawing): When defending against a pawn and rook, keep your rook on the 6th rank to prevent the enemy King from advancing. Once the pawn advances to the 6th rank, drop your rook to the 1st or 8th rank and check endlessly from behind!'
        ],
        keyRules: [
          'Place your Rook behind passed pawns—never in front of them (Tarrasch’s rule).',
          'Rook on the 4th rank builds the Lucena bridge to escort the pawn home.'
        ]
      }
    ]
  },

  // CHAPTER 6: FIDE LAWS & COMPETITIVE ETIQUETTE
  {
    id: 'ch-laws',
    title: 'FIDE Official Laws & Competition Rules',
    author: 'World Chess Federation (FIDE)',
    tagline: 'Touch-move, castling criteria, draw rules, and arbiter guidelines',
    iconName: 'BookOpen',
    lessons: [
      {
        id: 'fide-touch-move',
        title: 'Article 4: The Touch-Move Rule',
        subtitle: 'J’adoube, Moving, Capturing, and Clock Discipline',
        bookCitation: 'FIDE Laws of Chess (Articles 4 & 6)',
        theme: 'hanging_piece',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        content: [
          'Article 4.1: Each move must be made with one hand only.',
          'Article 4.2: If you want to center a piece on its square, you must first state your intention aloud by saying "J’adoube" or "I adjust" BEFORE touching it.',
          'Article 4.3: If you deliberately touch your own piece, you MUST move it if it has any legal move.',
          'If you deliberately touch an opponent’s piece, you MUST capture it if legal.',
          'Article 4.6: Once you have released your hand from a piece on a legal square, the move is completed and cannot be retracted.',
          'Article 6.7: The clock button must be pressed with the same hand that made the move!'
        ],
        keyRules: [
          'Think before you reach: never touch a piece until your calculation is complete.',
          'Always say "I adjust" or "J\'adoube" before touching a misaligned piece.',
          'Use the same hand to make your move and press the chess clock.'
        ]
      },
      {
        id: 'fide-draws-castling',
        title: 'Articles 3 & 9: Castling, Draws & Stalemate',
        subtitle: 'En Passant, Threefold Repetition, 50-Move Rule, and Dead Positions',
        bookCitation: 'FIDE Laws of Chess (Articles 3, 5 & 9)',
        theme: 'endgame',
        fen: '8/8/8/8/8/5k2/5p2/5K2 w - - 0 1',
        content: [
          'Article 3.8: Castling is prevented temporarily if the King is currently in check, crosses an attacked square, or lands on an attacked square.',
          'Article 3.7.d: En Passant capture is legal ONLY on the move immediately following the opponent’s two-square pawn advance.',
          'Article 5.2.a (Stalemate): If the player to move has no legal moves and their King is NOT in check, the game is an immediate draw.',
          'Article 9.2 (Threefold Repetition): A draw can be claimed if the identical position appears three times with the same player to move and same legal moves.',
          'Article 9.3 (50-Move Rule): A draw can be claimed if 50 consecutive moves have been made by each player with no pawn move and no capture.',
          'Article 9.6 (Dead Position): A position from which checkmate cannot occur by any possible series of legal moves (e.g. King vs King, King+Bishop vs King).'
        ],
        keyRules: [
          'Stalemate is a draw: when winning by a large margin, always ensure your opponent has at least one legal move!',
          'En Passant must be taken immediately or the right is lost forever.',
          'Castling rights are lost permanently once the King moves or the specific Rook moves.'
        ]
      }
    ]
  }
];

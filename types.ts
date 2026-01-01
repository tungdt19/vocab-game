export interface VocabularyItem {
  english: string;
  vietnamese: string;
  type: string;
  example_en: string;
  example_vn: string;
}

export enum GameStatus {
  IDLE = 'IDLE',
  FALLING = 'FALLING',
  WIN = 'WIN',
  LOSS = 'LOSS'
}

export interface GameState {
  currentWord: VocabularyItem | null;
  score: number;
  status: GameStatus;
  inputValue: string;
}

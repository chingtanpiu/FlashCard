
export type Familiarity = '熟悉' | '可能会忘' | '陌生' | '未知';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  familiarity: Familiarity;
}

export type BatchInputRow = {
  question: string;
  answer: string;
  tags: string;
};

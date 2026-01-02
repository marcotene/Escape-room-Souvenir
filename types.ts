
export type FontType = 'font-bangers' | 'font-marker' | 'font-roboto' | 'font-mono';

export interface TransformState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface TextElement extends TransformState {
  id: 'teamName' | 'score' | 'date';
  text: string;
  color: string;
  fontSize: number;
  fontFamily: FontType;
  visible: boolean;
}

export interface OverlayImage extends TransformState {
  id: string;
  uri: string;
}

export interface Mockup {
  id: string;
  name: string;
  overlays: OverlayImage[];
  teamNameState: TextElement;
  scoreState: TextElement;
  dateState: TextElement;
}

export enum Page {
  LIST = 'LIST',
  SETUP = 'SETUP',
  FOTOFINISH = 'FOTOFINISH'
}

export interface AppState {
  mockups: Mockup[];
  currentPage: Page;
  editingMockupId: string | null;
}

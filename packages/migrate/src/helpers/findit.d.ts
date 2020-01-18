declare module 'findit' {
  import { EventEmitter } from 'events';
  export default function findit(dir: string): EventEmitter;
}

// 3rd party
import { List, Map, fromJS } from 'immutable';

// project deps
import { Instrument } from './Instruments';
import { Visualizer } from './Visualizers';
import { AppState } from './State';

/** ------------------------------------------------------------------------ **
 * All user input is handled by DispatchAction.
 ** ------------------------------------------------------------------------ */

/**
 * Observation: pure map (compare and contrast with impure map)
 *
 * 'instrument': Instrument
 * 'visualizer': Visualizer
 * 'songs': List<string>
 * 'notes': List<{id: number, songTitle: string, notes: string}>
 */
type DispatchArgs = {
  [key: string]: any;
};

// A simple algebraic data-type with string literal types
type DispatchActionType =
  | 'SET_SOCKET'
  | 'DELETE_SOCKET'
  | 'SET_SONGS'
  | 'PLAY_SONG'
  | 'STOP_SONG'
  | 'SET_LOCATION'
  | 'TRIGGER_RECORDING'
  | 'GET_RECORDING_STATUS'
  | 'RECORD_A_SONG'
  | 'TRIGGER_RECORDING_POPUP'
  | 'ADD_NOTE_TO_SONG'
  | 'CREATE_SONG';

export class DispatchAction {
  readonly type: DispatchActionType;
  readonly args: Map<string, any>;

  constructor(type: DispatchActionType, args?: DispatchArgs) {
    this.type = type;
    this.args = fromJS(args) as Map<string, any>;
  }
}

/** ------------------------------------------------------------------------ **
 * Top-level application reducer.
 ** ------------------------------------------------------------------------ */

export function appReducer(state: AppState, action: DispatchAction): AppState {
  const { type, args } = action;

  console.debug(`${type}`);

  // Question: Does this function remind of you registering callbacks?
  const newState = (() => {
    switch (type) {
      case 'SET_SOCKET': {
        const oldSocket = state.get('socket');
        if (oldSocket) {
          oldSocket.close();
        }

        return state.set('socket', args.get('socket'));
      }
      
      case 'DELETE_SOCKET': {
        return state.delete('socket');
      }
      
      case 'SET_SONGS': {
        const songs = args.get('songs');
        return state.set('songs', songs);
      }
      
      case 'PLAY_SONG': {
        const notes = state
          .get('songs')
          .find((s: any) => s.get('id') === args.get('id'))
          .get('notes');
        return state.set('notes', notes);
      }
      
      case 'STOP_SONG': {
        return state.delete('notes');
      }
      
      case 'SET_LOCATION': {
        const pathname = args.getIn(['location', 'pathname'], '') as string;
        const search = args.getIn(['location', 'search'], '') as string;

        const instrumentName: string = pathname.substring(1);
        const visualizerName: string =
          new URLSearchParams(search.substring(1)).get('visualizer') ?? '';
        const instruments: List<Instrument> = state.get('instruments');
        const visualizers: List<Visualizer> = state.get('visualizers');

        const instrument = instruments.find(i => i.name === instrumentName);
        const visualizer = visualizers.find(v => v.name === visualizerName);

        return state
          .set('instrument', instrument)
          .set('visualizer', visualizer);
      }
      
      case 'TRIGGER_RECORDING': {
        const isRecording = args.get('isRecording');

        return state.set('isRecording', !isRecording);
      }

      case 'TRIGGER_RECORDING_POPUP': {
        const openPopup = args.get('openPopup');

        return state.set('openPopup', !openPopup);
      }

      case 'RECORD_A_SONG': {
        const song: string[] = args.get('song');

        return state.set('song', song);
      }

      case 'ADD_NOTE_TO_SONG': {
        const note: string = args.get('note');
        let songCopy: string[] = state.get('song');
            songCopy = [...songCopy, note];

        return state.set('song', songCopy);
      }

      case 'CREATE_SONG': {
        const songTitle = args.get('songTitle');
        const song = state.get('song');

        console.log(songTitle);
        console.log(song);

        // should reinitialize song and songTitle back to initial states after 
        return state.set('songTitle', songTitle);
      }

      default:
        console.error(`type unknown: ${type}\n`, args.toJS());
        return state;
    }
  })();

  console.debug(newState.update('socket', s => (s ? '[socket]' : s)).toJS());

  return newState;
}

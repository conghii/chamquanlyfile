import { setup, assign } from 'xstate';
import type { AssetFile, FolderNode, UserProfile } from '../types';

export interface AppContext {
    user: UserProfile | null;
    currentFolder: FolderNode | null;
    files: AssetFile[];
    selectedFile: AssetFile | null;
    error: string | null;
}

export type AppEvent =
    | { type: 'LOGIN_SUCCESS'; user: UserProfile }
    | { type: 'LOGOUT' }
    | { type: 'BROWSE'; folder: FolderNode }
    | { type: 'SEARCH' }
    | { type: 'DROP_FILE' }
    | { type: 'CLICK_FILE'; file: AssetFile }
    | { type: 'EDIT' }
    | { type: 'SAVE' }
    | { type: 'DONE' }
    | { type: 'FAIL'; error: string }
    | { type: 'DISMISS' }
    | { type: 'BACK' }
    | { type: 'SET_FILES'; files: AssetFile[] };

export const appMachine = setup({
    types: {
        context: {} as AppContext,
        events: {} as AppEvent,
    },
}).createMachine({
    id: 'app',
    initial: 'auth',
    context: {
        user: null,
        currentFolder: null,
        files: [],
        selectedFile: null,
        error: null,
    },
    states: {
        auth: {
            on: {
                LOGIN_SUCCESS: {
                    target: 'idle',
                    actions: assign({ user: ({ event }) => event.user }),
                },
            },
        },
        idle: {
            on: {
                BROWSE: {
                    target: 'browsing',
                    actions: assign({ currentFolder: ({ event }) => event.folder }),
                },
                SEARCH: 'searching',
                DROP_FILE: 'uploading',
                LOGOUT: { target: 'auth', actions: assign({ user: () => null }) },
            },
        },
        browsing: {
            on: {
                BROWSE: {
                    target: 'browsing',
                    actions: assign({ currentFolder: ({ event }) => event.folder }),
                },
                CLICK_FILE: {
                    target: 'previewing',
                    actions: assign({ selectedFile: ({ event }) => event.file }),
                },
                SEARCH: 'searching',
                DROP_FILE: 'uploading',
                BACK: 'idle',
                SET_FILES: { actions: assign({ files: ({ event }) => event.files }) },
                FAIL: { target: 'error', actions: assign({ error: ({ event }) => event.error }) },
            },
        },
        searching: {
            on: {
                CLICK_FILE: {
                    target: 'previewing',
                    actions: assign({ selectedFile: ({ event }) => event.file }),
                },
                BROWSE: {
                    target: 'browsing',
                    actions: assign({ currentFolder: ({ event }) => event.folder }),
                },
                BACK: 'idle',
                SET_FILES: { actions: assign({ files: ({ event }) => event.files }) },
            },
        },
        uploading: {
            on: {
                DONE: 'idle',
                FAIL: { target: 'error', actions: assign({ error: ({ event }) => event.error }) },
                BACK: 'idle',
            },
        },
        previewing: {
            on: {
                EDIT: 'editing',
                BACK: 'browsing',
                DISMISS: 'browsing',
            },
        },
        editing: {
            on: {
                SAVE: 'previewing',
                BACK: 'previewing',
            },
        },
        error: {
            on: {
                DISMISS: 'idle',
            },
        },
    },
});

import { setup, assign } from 'xstate';
import type { FileType } from '../types';

export interface UploadContext {
    files: File[];
    currentFileIndex: number;
    suggestedName: string;
    detectedType: FileType;
    tags: string[];
    asin: string | null;
    category: string;
    progress: number;
    error: string | null;
}

export type UploadEvent =
    | { type: 'DROP'; files: File[] }
    | { type: 'PICK'; files: File[] }
    | { type: 'CONFIRM' }
    | { type: 'SUBMIT'; name: string; tags: string[]; asin: string | null; category: string }
    | { type: 'PROGRESS'; percent: number }
    | { type: 'SUCCESS' }
    | { type: 'ERROR'; error: string }
    | { type: 'RETRY' }
    | { type: 'CANCEL' }
    | { type: 'RESET' };

export const uploadMachine = setup({
    types: {
        context: {} as UploadContext,
        events: {} as UploadEvent,
    },
}).createMachine({
    id: 'upload',
    initial: 'idle',
    context: {
        files: [],
        currentFileIndex: 0,
        suggestedName: '',
        detectedType: 'other',
        tags: [],
        asin: null,
        category: '',
        progress: 0,
        error: null,
    },
    states: {
        idle: {
            on: {
                DROP: {
                    target: 'selected',
                    actions: assign({
                        files: ({ event }) => event.files,
                        currentFileIndex: () => 0,
                    }),
                },
                PICK: {
                    target: 'selected',
                    actions: assign({
                        files: ({ event }) => event.files,
                        currentFileIndex: () => 0,
                    }),
                },
            },
        },
        selected: {
            on: {
                CONFIRM: 'naming',
                CANCEL: {
                    target: 'idle',
                    actions: assign({ files: () => [], currentFileIndex: () => 0 }),
                },
            },
        },
        naming: {
            on: {
                SUBMIT: {
                    target: 'uploading',
                    actions: assign({
                        suggestedName: ({ event }) => event.name,
                        tags: ({ event }) => event.tags,
                        asin: ({ event }) => event.asin,
                        category: ({ event }) => event.category,
                    }),
                },
                CANCEL: {
                    target: 'idle',
                    actions: assign({ files: () => [], currentFileIndex: () => 0 }),
                },
            },
        },
        uploading: {
            on: {
                PROGRESS: {
                    actions: assign({ progress: ({ event }) => event.percent }),
                },
                SUCCESS: 'indexed',
                ERROR: {
                    target: 'failed',
                    actions: assign({ error: ({ event }) => event.error }),
                },
            },
        },
        indexed: {
            on: {
                RESET: {
                    target: 'idle',
                    actions: assign({
                        files: () => [],
                        currentFileIndex: () => 0,
                        progress: () => 0,
                        suggestedName: () => '',
                    }),
                },
            },
        },
        failed: {
            on: {
                RETRY: 'uploading',
                CANCEL: {
                    target: 'idle',
                    actions: assign({ files: () => [], error: () => null, progress: () => 0 }),
                },
            },
        },
    },
});

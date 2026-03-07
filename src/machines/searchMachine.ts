import { setup, assign } from 'xstate';
import type { AssetFile, SearchFilters, FileType } from '../types';

export interface SearchContext {
    query: string;
    filters: SearchFilters;
    results: AssetFile[];
    isLoading: boolean;
}

export type SearchEvent =
    | { type: 'TYPE'; query: string }
    | { type: 'SEARCH_COMPLETE'; results: AssetFile[] }
    | { type: 'NO_RESULTS' }
    | { type: 'CLEAR' }
    | { type: 'SET_TYPE_FILTER'; fileType: FileType | 'all' }
    | { type: 'SET_TAG_FILTER'; tags: string[] }
    | { type: 'SET_DATE_FILTER'; from: Date | null; to: Date | null };

export const searchMachine = setup({
    types: {
        context: {} as SearchContext,
        events: {} as SearchEvent,
    },
}).createMachine({
    id: 'search',
    initial: 'empty',
    context: {
        query: '',
        filters: { query: '', type: 'all', tags: [], asin: null, dateFrom: null, dateTo: null },
        results: [],
        isLoading: false,
    },
    states: {
        empty: {
            on: {
                TYPE: {
                    target: 'typing',
                    actions: assign({
                        query: ({ event }) => event.query,
                        filters: ({ context, event }) => ({ ...context.filters, query: event.query }),
                    }),
                },
                SET_TYPE_FILTER: {
                    actions: assign({
                        filters: ({ context, event }) => ({ ...context.filters, type: event.fileType }),
                    }),
                },
                SET_TAG_FILTER: {
                    actions: assign({
                        filters: ({ context, event }) => ({ ...context.filters, tags: event.tags }),
                    }),
                },
            },
        },
        typing: {
            on: {
                TYPE: {
                    target: 'typing',
                    actions: assign({
                        query: ({ event }) => event.query,
                        filters: ({ context, event }) => ({ ...context.filters, query: event.query }),
                    }),
                },
                SEARCH_COMPLETE: {
                    target: 'hasResults',
                    actions: assign({ results: ({ event }) => event.results, isLoading: () => false }),
                },
                NO_RESULTS: {
                    target: 'noResults',
                    actions: assign({ isLoading: () => false }),
                },
                CLEAR: {
                    target: 'empty',
                    actions: assign({
                        query: () => '',
                        results: () => [],
                        filters: () => ({ query: '', type: 'all' as const, tags: [], asin: null, dateFrom: null, dateTo: null }),
                    }),
                },
            },
        },
        hasResults: {
            on: {
                TYPE: {
                    target: 'typing',
                    actions: assign({
                        query: ({ event }) => event.query,
                        filters: ({ context, event }) => ({ ...context.filters, query: event.query }),
                    }),
                },
                CLEAR: {
                    target: 'empty',
                    actions: assign({
                        query: () => '',
                        results: () => [],
                        filters: () => ({ query: '', type: 'all' as const, tags: [], asin: null, dateFrom: null, dateTo: null }),
                    }),
                },
                SET_TYPE_FILTER: {
                    actions: assign({
                        filters: ({ context, event }) => ({ ...context.filters, type: event.fileType }),
                    }),
                },
                SET_TAG_FILTER: {
                    actions: assign({
                        filters: ({ context, event }) => ({ ...context.filters, tags: event.tags }),
                    }),
                },
            },
        },
        noResults: {
            on: {
                TYPE: {
                    target: 'typing',
                    actions: assign({
                        query: ({ event }) => event.query,
                        filters: ({ context, event }) => ({ ...context.filters, query: event.query }),
                    }),
                },
                CLEAR: {
                    target: 'empty',
                    actions: assign({
                        query: () => '',
                        results: () => [],
                        filters: () => ({ query: '', type: 'all' as const, tags: [], asin: null, dateFrom: null, dateTo: null }),
                    }),
                },
            },
        },
    },
});

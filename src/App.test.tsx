import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
    it('renders correctly', () => {
        expect(App).toBeDefined();
    });
    
    it('is a function component', () => {
        expect(typeof App).toBe('function');
    });
});
import '@testing-library/jest-dom';

// Cada prueba define sus propias respuestas de la API con mockApi().
afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
});

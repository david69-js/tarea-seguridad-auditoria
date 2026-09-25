/** Pruebas unitarias y de componentes del frontend (Jest + Testing Library). */
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    moduleNameMapper: {
        // Los estilos no importan en las pruebas
        '\\.(css)$': 'identity-obj-proxy',
    },
    testMatch: ['<rootDir>/tests/**/*.test.{js,jsx}'],
};

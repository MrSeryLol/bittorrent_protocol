import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    moduleDirectories: ["node_modules", "src"],
    moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
    testPathIgnorePatterns: ["<rootDir>/build/"],
    //transformIgnorePatterns: ['/node_modules/(?!(bencode)/)'],
    // transform: {
    //     '\\.[t]sx?$': ['ts-jest', { useESM: true } ],
    // },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    extensionsToTreatAsEsm: ['.ts']
}

export default jestConfig
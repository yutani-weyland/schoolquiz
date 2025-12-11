import { can, type AppUser, type Role } from './permissions';

const mockUser = (role: Role): AppUser => ({
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    platformRole: role,
});

const tests = [
    {
        name: 'Student cannot create quiz',
        user: mockUser('Student'),
        action: 'create',
        resource: 'quiz',
        expected: false,
    },
    {
        name: 'Teacher can create quiz',
        user: mockUser('Teacher'),
        action: 'create',
        resource: 'quiz',
        expected: true,
    },
    {
        name: 'OrgAdmin can manage users',
        user: mockUser('OrgAdmin'),
        action: 'manage',
        resource: 'user',
        expected: true,
    },
    {
        name: 'PlatformAdmin can manage system',
        user: mockUser('PlatformAdmin'),
        action: 'manage',
        resource: 'system',
        expected: true,
    },
    {
        name: 'Teacher cannot manage system',
        user: mockUser('Teacher'),
        action: 'manage',
        resource: 'system',
        expected: false,
    },
];

console.log('Running RBAC Verification Tests...\n');

let passed = 0;
let failed = 0;

tests.forEach((test) => {
    const result = can(test.user, test.action as any, test.resource as any);
    if (result === test.expected) {
        console.log(`✅ ${test.name}: PASSED`);
        passed++;
    } else {
        console.error(`❌ ${test.name}: FAILED (Expected ${test.expected}, got ${result})`);
        failed++;
    }
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    process.exit(1);
}

#!/usr/bin/env node
// PostToolUse hook: runs `npx tsc --noEmit` after Edit/Write on src/**/*.ts(x).
// Reads tool input JSON from stdin. Silent unless TS errors found.
import { execSync } from 'node:child_process';

let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
    try {
        const j = JSON.parse(data || '{}');
        const f = (j.tool_input && (j.tool_input.file_path || j.tool_input.path)) || '';
        if (!/[\\/]src[\\/].*\.tsx?$/.test(f)) {
            process.exit(0);
        }
        execSync('npx tsc --noEmit', { stdio: 'inherit' });
    } catch (e) {
        // Surface TS errors but don't block the session.
        process.exit(0);
    }
});

#!/usr/bin/env node
// PreToolUse hook: blocks Edit/Write on sensitive files.
// Reads tool input JSON from stdin. Outputs hookSpecificOutput with deny decision
// when target matches a sensitive pattern.

const BLOCKED = [
    /(^|[\\/])\.env(\..+)?$/i,        // .env, .env.local, .env.production
    /(^|[\\/])package-lock\.json$/i,
    /(^|[\\/])\.claude[\\/]settings\.local\.json$/i,
    /(^|[\\/])skills-lock\.json$/i,
];

let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
    let f = '';
    try {
        const j = JSON.parse(data || '{}');
        f = (j.tool_input && (j.tool_input.file_path || j.tool_input.path)) || '';
    } catch {
        process.exit(0);
    }
    if (!f) process.exit(0);

    const hit = BLOCKED.find((re) => re.test(f));
    if (hit) {
        const out = {
            hookSpecificOutput: {
                hookEventName: 'PreToolUse',
                permissionDecision: 'deny',
                permissionDecisionReason: `Edit/Write blocked: "${f}" matches sensitive pattern ${hit}. Ask user before modifying secrets or lockfiles.`,
            },
        };
        process.stdout.write(JSON.stringify(out));
    }
    process.exit(0);
});

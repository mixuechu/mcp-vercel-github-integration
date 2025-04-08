#!/usr/bin/env node
import { runServer } from '../src/index.js';
import minimist from 'minimist';

// 解析命令行参数
const argv = minimist(process.argv.slice(2), {
  string: ['vercel-key', 'github-token'],
  alias: {
    v: 'vercel-key',
    g: 'github-token'
  }
});

if (!argv['vercel-key'] || !argv['github-token']) {
  console.error('Usage: npx your-package --vercel-key <key> --github-token <token>');
  console.error('Short: npx your-package -v <key> -g <token>');
  process.exit(1);
}

runServer(argv['vercel-key'], argv['github-token']).catch(err => {
  console.error('Server error:', err);
  process.exit(1);
});
#!/usr/bin/env node

import fs from 'fs';
import readlineModule from  'readline';
import chalk from 'chalk';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let stdin = process.stdin;
let stdout = process.stdout;
let buffer = [];
let filtered_data = [];
let idx = -1;
const data = JSON.parse(fs.readFileSync(__dirname + '/data.json', 'utf8'));

data.sort();
readlineModule.emitKeypressEvents(process.stdin);
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');
// stdout.setEncoding('utf8');

function print(str, type = 'url') {
    stdout.clearLine(0);
    stdout.cursorTo(0);

    if (type == 'command') {
        stdout.write(chalk.green(str));
    } else {
        stdout.write(str);
    }

    stdout.cursorTo(str.length);    
}

function filter_data(input) {
    filtered_data = data.filter(item => {
        let arr = item.split('|');
        let keywords;

        if (arr.length == 1) {
            keywords = arr[0];    
        } else if (arr.length >= 2) {
            keywords = arr[0] + ' ' + arr[1];                    
        }

        return keywords.includes(input);
    })    
}

function open_url(url) {
    exec('explorer "' + url + '"');           
}

function execute(cmd) {
    exec(cmd);
}

stdin.on( 'data', function( key ){
  // ctrl-c ( end of text )
  if ( key === '\u0003' ) {
    process.exit();
  } else if (key == '\u001B') {
    stdout.clearLine(0);
    stdout.cursorTo(0);
    buffer = [];
    idx = -1;
  }
})

stdin.on('keypress', (char, key) => {
    if ((key.name == 'cx') || (key.name == 'zx')) {
        if (key.ctrl) {
            process.exit();
        }
    } else if ((key.name == 'up') || (key.name == 'left')) {
        if (filtered_data.length) {            
            idx = idx - 1;

            if (idx < 0) {
                idx = 0;
                return;
            }

            let input = buffer.join('');
            let arr = filtered_data[idx].split('|');            
            let type = 'url';

            if (arr.length > 2) {
                if (arr[2].includes('execute(')) {
                    type = 'command';
                }
            }

            let output = arr[0]

            if (input == output) {
                return;
            }

            buffer = [];

            for (let c of output) {
                buffer.push(c);
            }

            print(output, type);
        }

        return;

    } else if ((key.name == 'down') || (key.name == 'right')) {
        if (filtered_data.length) {            
            idx = idx + 1;

            if (idx > filtered_data.length - 1) {
                idx = filtered_data.length - 1;
                return;
            }

            let input = buffer.join('');
            let arr = filtered_data[idx].split('|');
            let type = 'url';
            let output = arr[0];

            if (arr.length > 2) {
                if (arr[2].includes('execute(')) {
                    type = 'command';
                }                
            }

            if (input == output) {
                return;
            }

            buffer = [];

            for (let c of output) {
                buffer.push(c);
            }

            print(output, type);
        }

        return;
    } else if (key.name == 'tab') {        
        if (filtered_data.length) {            
            idx += 1;

            if (idx > filtered_data.length - 1) {
                idx = filtered_data.length - 1;
                return;
            }

            let input = buffer.join('');
            let arr = filtered_data[idx].split('|');
            let type = 'url';
            let output = arr[0];

            if (arr.length > 2) {
                if (arr[2].includes('execute(')) {
                    type = 'command';
                }                
            }

            if (input == output) {
                return;
            }

            buffer = [];

            for (let c of output) {
                buffer.push(c);
            }

            print(output, type);
        }

        return;
    } else if (key.name == 'return') {
        if (filtered_data.length) {            
            let arr = filtered_data[idx].split('|');
            let cmd, matches;

            if (arr.length <= 2) {
                cmd = 'go(https://' + arr[0] + ')';
            } else {
                cmd = arr[2];                
            }

            matches = cmd.match(/^go\((https?:\/\/.+)\)/);

            if (matches) {
                open_url(matches[1]);                            
            } else {
                matches = cmd.match(/^execute\((.*)\)/);

                if (matches) {
                    execute(matches[1]);                                                            
                }
            }
        }

        setTimeout(() => {
            process.exit();
        }, 300)
    } else if (key.name == 'backspace') {
        stdout.cursorTo(buffer.length - 1);
        stdout.clearLine(1);
        buffer = buffer.slice(0, buffer.length - 1);

        let input = buffer.join('');

        filter_data(input);
        idx = -1;
    } else {
        if (char) {            
            buffer.push(char);

            let input = buffer.join('');
            let type = 'url';

            filter_data(input);

            idx = -1;

            if (buffer.length > 0) {
                if (buffer[0] == '$') {
                    type = 'command';
                }
            }

            if (type == 'command') {
                process.stdout.write(chalk.green(char));
            } else {
                process.stdout.write(char);
            }
        }
    }
})

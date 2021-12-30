#!/usr/bin/env node

/*
Copyright 2021 NCC Group

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const program = require('commander');
const version = require('../package.json').version;
const frida = require('frida');
const { format, promisify } = require('util');
const { exec } = require('child_process');
const pExec = promisify(exec);
const Mustache = require('mustache');

const hook = require('../lib/hook');

let device, platform, target, paused, config, hooks;

main().catch((err)=>{
  console.error(err);
  process.exit(1);
});

async function main() {
  program
    .version(version)
    .usage('[options] -p <pid> { -a <agent> | -j <jvmti> } [args] ')
    .option('-p, --pid [ppid]', 'attach to pid')
    .option('-a, --agent [agent]', 'Path to (from target process) Java agent JAR')
    .option('-j, --jvmti [jvmti]', 'Path to (from target process) JVMTI shared library')
    .option('-t, --type [platform]', 'One of "HotSpot", "OpenJ9", or "J9" (case insensitive). Defaults to "hotspot".', 'hotspot')
    .parse(process.argv);

  let options = program.opts();
  //console.log(require('util').inspect(program));
  //console.log(require('util').inspect(options));

  if (!options.pid) {
    console.error("Error: --pid must be supplied.");
    program.help();
  }
  let pid = parseInt(options.pid);
  
  if (isNaN(pid) || pid <= 0) {
    console.error("Error: Invalid --pid: " + program.pid);
    program.help();
  }

  program.args = program.args || [''];

  if (!!options.jvmti && !!options.agent) {
    console.error("Error: --agent and --jvmti are mutually exclusive.")
    program.help();
  } else if (!!options.jvmti + !!options.agent == 0) {
    console.error("Error: --agent or --jvmti must be supplied.")
    program.help();
  }

  if (program.args.length > 1) {
    console.error("Error: More than one agent argument provided.")
    program.help();
  }

  if (!!options.type) {
    options.type = options.type.toLowerCase();
    if (options.type !== "hotspot" && options.type !== "openj9" && options.type != "j9") {
      console.error("Error: Invalid JVM type specified. Only HotSpot and (Open)J9 are supported")
      program.help();
    }
  }

  if (options.type.endsWith("j9")) {
    options.type = "j9";
  }

  let args = {};

  if (!!options.jvmti) {
    args['arg0'] = options.jvmti;
    let abs = false;
    if (options.jvmti.search(/\./) != -1) {
      abs = true;
    } else if (options.jvmti.search(/\//) != -1) {
      abs = true;
    } else if (options.jvmti.search(/\\/) != -1) {
      abs = true;
    }
    args['arg1'] = abs ? "true" : "false";
    args['arg2'] = program.args[0];
  } else {
    args['arg0'] = "instrument";
    args['arg1'] = "false";
    args['arg2'] = options.agent + "=" + program.args[0];
  }

  let jvm = options.type || "hotspot";

  await hook.run(pid, jvm, args);
  process.exit(0);
}

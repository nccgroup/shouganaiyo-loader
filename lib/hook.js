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

const frida = require('frida');
const { profile } = require('./profile');
const { genScriptCode } = require('./script');
const { attach } = require('./attach');

async function run(pid, jvm, args) {
  let session;

  try {
    session = await frida.attach(pid);
  } catch (err) {
    throw err;
  }

  let { platform, libjvm } = await profile(session);

  let scriptCode = await genScriptCode(jvm, platform, libjvm);

  //console.log(JSON.stringify(args))
  let { arg0, arg1, arg2 } = args;
  let async_load_agent_caller = async function(load_agent) {
    await load_agent(arg0, arg1, arg2);
  }
  await attach(pid, session, scriptCode, jvm, platform, async_load_agent_caller);

  await session.detach();
}

module.exports = {
  "run": run
};

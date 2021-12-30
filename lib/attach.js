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

async function attach(pid, session, scriptCode, jvm, platform, load_agent_fn) {
  if (jvm === "hotspot") {
    if (platform == "darwin" || platform == "linux") {
      await attach_unix(pid, session, scriptCode, load_agent_fn);
    } else if (platform == "windows") {
      await attach_windows(session, scriptCode, load_agent_fn);
    }
  } else if (jvm === "j9") {
    await attach_j9(session, scriptCode, load_agent_fn);
  }
}


async function attach_unix(pid, session, scriptCode, load_agent_fn) {
  //console.log(scriptCode)
  const script = await session.createScript(scriptCode);

  let finish = new Promise((res,rej)=>{
    //script.events.listen('message', (message, data) => {
    script.message.connect((message) => {
      if (message.type == "send") {
        res(message.payload);
      }
    });
  });
  await script.load();

  let api = script.exports;
  let load_agent = api.load_agent;

  await load_agent_fn(load_agent);

  process.kill(pid, 'SIGQUIT');

  await finish;

  await script.unload();
}


async function attach_windows(session, scriptCode, load_agent_fn) {
  const script = await session.createScript(scriptCode);
  await script.load();

  let api = await script.exports;
  let load_agent = api.load_agent;

  await load_agent_fn(load_agent);

  await script.unload();
}

async function attach_j9(session, scriptCode, load_agent_fn) {
  //console.log(scriptCode)
  const script = await session.createScript(scriptCode);
  await script.load();

  let api = await script.exports;
  let load_agent = api.load_agent;

  await load_agent_fn(load_agent);

  await script.unload();
}


module.exports = {
  "attach": attach
};

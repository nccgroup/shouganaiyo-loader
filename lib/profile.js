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

async function getProfile(session) {
  const script = await session.createScript(`
    function r() {
      var platform = Process.platform;
      var modname;
      if (platform == "darwin") {
        modname = "libjvm.dylib";
      } else if (platform == "linux") {
        modname = "libjvm.so";
      } else if (platform == "windows") {
        send({
          'platform': Process.platform
        });
        return;
      } else {
        send({
          'platform': Process.platform
        });
        return;
      }

      Process.enumerateModules({
        "onMatch": function(m) {
          if (m.name == modname) {
            send({
              'platform': Process.platform,
              'libjvm': m.path
            });
            return "stop";
          }
        },
        "onComplete": function() {}
      });
    }
    r();
  `);
  let p = new Promise((res,rej)=>{
    //script.events.listen('message', (message, data) => {
    script.message.connect((message) => {
      if (message.type == "send") {
        res(message.payload);
      }
    });
  });
  await script.load();
  let profile = await p;
  await script.unload();
  return profile;
}

module.exports = {
  "profile": getProfile
};

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

const { format, promisify } = require('util');
const path = require('path');
const { readFile } = require('fs');
const { exec } = require('child_process');
const pReadFile = promisify(readFile);
const pExec = promisify(exec);

const Mustache = require('mustache');

async function genScriptCode(jvm, platform, libjvm) {

  var scriptContent;
  if (jvm === "hotspot") {
    if (platform == "darwin") {
      scriptContent = await generateScriptContent_darwin(libjvm);
    } else if (platform == "linux") {
      scriptContent = await generateScriptContent_linux(libjvm);
    } else if (platform == "windows") {
      scriptContent = await generateScriptContent_windows();
    } else {
      console.error("Unknown platform: " + platform);
      process.exit(1);
    }
  } else if (jvm == "j9") {
    scriptContent = await generateScriptContent_j9(platform);
  } else {
    console.error("Unknown JVM: " + jvm);
    process.exit(1);
  }

  return scriptContent;
}


async function generateScriptContent_darwin(libjvm) {

  let escaped_libjvm = libjvm.replace("'", "'\\''");

  let dam_cmd = format("nm '%s' | grep _DisableAttachMechanism | awk '{ print $1; }'", escaped_libjvm);
  let dam_offset = "0x" + (await pExec(dam_cmd)).stdout.trim();

  let unix_template = await getAsset('unix_template.js');

  return scriptcontent = Mustache.render(unix_template, {
    "stringStreamCtor": "_ZN12stringStreamC1Em",
    "load_agent_library": "_ZN11JvmtiExport18load_agent_libraryEP15AttachOperationP12outputStream",
    "load_agent_library_nine": "_ZN11JvmtiExport18load_agent_libraryEPKcS1_S1_P12outputStream",
    "is_init_trigger": "_ZN14AttachListener15is_init_triggerEv",
    "sigexitnum_pd": "_ZN2os13sigexitnum_pdEv",
    "signal_wait": "_ZN2os11signal_waitEv",
    "DisableAttachMechanism": dam_offset,
    "libjvm": "libjvm.dylib"
  });
}

async function generateScriptContent_linux(libjvm) {
  let escaped_libjvm = libjvm.replace("'", "'\\''");

  let dam_cmd = format("readelf -s -W '%s' | grep DisableAttachMechanism | awk '{ print $2; }'", escaped_libjvm);
  let dam_offset = "0x" + (await pExec(dam_cmd)).stdout.trim();

  let unix_template = await getAsset('unix_template.js');

  return scriptcontent = Mustache.render(unix_template, {
    "stringStreamCtor": "_ZN12stringStreamC1Em",
    "load_agent_library": "_ZN11JvmtiExport18load_agent_libraryEP15AttachOperationP12outputStream",
    "load_agent_library_nine": "_ZN11JvmtiExport18load_agent_libraryEPKcS1_S1_P12outputStream",
    "is_init_trigger": "_ZN14AttachListener15is_init_triggerEv",
    "sigexitnum_pd": "_ZN2os13sigexitnum_pdEv",
    "signal_wait": "_ZN2os11signal_waitEv",
    "DisableAttachMechanism": dam_offset,
    "libjvm": "libjvm.so"
  });
}

async function generateScriptContent_windows() {
  return await getAsset('windows_template.js');
}

async function generateScriptContent_j9(platform) {

  let libjvm;
  if (platform === "darwin") { //not actually supported yet
    libjvm = "libjvm.dylib"
  } else if (platform === "linux") {
    libjvm = "libjvm.so"
  } else if (platform === "windows") {
    libjvm = "jvm.dll"
  } else {
    console.error("Unknown platform: " + platform);
    process.exit(1);
  }

  let j9_template = await getAsset('j9_template.js');

  return scriptcontent = Mustache.render(j9_template, {
    "libjvm": libjvm
  });
}

async function getAsset(asset_name) {
  let asset_path = path.join(__dirname, '..', 'assets', asset_name);
  return (await pReadFile(asset_path)).toString('utf8');
}


module.exports = {
  "genScriptCode": genScriptCode
};

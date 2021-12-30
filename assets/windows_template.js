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

var jeo_addr = Module.findExportByName("jvm.dll", "JVM_EnqueueOperation");
var pipename = "\\\\.\\pipe\\"; // literal js
//var pipename = "\\\\\\\\.\\\\pipe\\\\"; // string-escaped js

var jeo = new NativeFunction(
  jeo_addr, 'int',
  [1,2,3,4,5].map(function(){return "pointer";})
);

var s = Memory.allocUtf8String;

function load_agent(arg1, arg2, arg3) {
  jeo(s("load"), s(arg1), s(arg2), s(arg3), s(pipename));
}

rpc.exports = {
  "load_agent": load_agent
};

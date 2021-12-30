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

function load_agent(arg0, isAbs, arg2) {
  let utf8 = Memory.allocUtf8String;
  var decorate;
  if (isAbs === "true") {
    decorate = 0;
  } else if (isAbs === "false") {
    decorate = 1;
  } else {
    console.log("bad isAbs value");
    return;
  }

  var JNI_GetCreatedJavaVMs;

  Module.enumerateExports("{{libjvm}}", {
    "onMatch": function(ex) {
      if (ex.name == "JNI_GetCreatedJavaVMs") {
        JNI_GetCreatedJavaVMs = new NativeFunction(
          ex.address, 'int', ['pointer', 'pointer', 'pointer']
        );
        return "stop";
      }
    },
    "onComplete": function() {}
  });

  var vm_buf = Memory.alloc(1*Process.pointerSize);
  var bufLen = ptr(1);
  var nVMs = Memory.alloc(Process.pointerSize);

  if (JNI_GetCreatedJavaVMs(vm_buf, bufLen, nVMs) !== 0) {
    return;
  }
  //console.log("nVMs: " + Memory.readPointer(nVMs));

  if (parseInt(Memory.readPointer(nVMs)) !== 1) {
    return;
  }

  var JavaVM = Memory.readPointer(vm_buf);
  var JavaVM_functions = Memory.readPointer(JavaVM);

  var AttachCurrentThread = new NativeFunction(
    Memory.readPointer(JavaVM_functions.add(4*Process.pointerSize)),
    'int',
    ['pointer', 'pointer', 'pointer']
  );

  var env_buf = Memory.alloc(Process.pointerSize);

  if (AttachCurrentThread(JavaVM, env_buf, NULL) !== 0) {
    return;
  }

  var JNIEnv = Memory.readPointer(env_buf);
  var JNIEnv_functions = Memory.readPointer(JNIEnv);

  var GetVersion = new NativeFunction(
    Memory.readPointer(JNIEnv_functions.add(4*Process.pointerSize)),
    'int',
    ['pointer']
  );

  //console.log(GetVersion(JNIEnv));

  var FindClass = new NativeFunction(
    Memory.readPointer(JNIEnv_functions.add(6*Process.pointerSize)),
    'pointer',
    ['pointer', 'pointer']
  );

  let ExceptionOccurred = new NativeFunction(
    Memory.readPointer(JNIEnv_functions.add(15*Process.pointerSize)),
    'pointer', ['pointer']
  );

  let ExceptionDescribe = new NativeFunction(
    Memory.readPointer(JNIEnv_functions.add(16*Process.pointerSize)),
    'void', ['pointer']
  );

  let ExceptionClear = new NativeFunction(
    Memory.readPointer(JNIEnv_functions.add(17*Process.pointerSize)),
    'void', ['pointer']
  );

  let Attachment_classname = utf8("com/ibm/tools/attach/target/Attachment");
  let Attachment = FindClass(
    JNIEnv,
    Attachment_classname
  );
  if (Attachment.isNull()) {
    ExceptionClear(JNIEnv);
    let Attachment_alt_classname = utf8("openj9/internal/tools/attach/target/Attachment");
    Attachment = FindClass(
      JNIEnv,
      Attachment_alt_classname
    );
  }

  var AllocObject = new NativeFunction(
    Memory.readPointer(JNIEnv_functions.add(27*Process.pointerSize)),
    'pointer',
    ['pointer', 'pointer']
  );

  var GetMethodID = new NativeFunction(
    Memory.readPointer(JNIEnv_functions.add(33*Process.pointerSize)),
    'pointer',
    ['pointer', 'pointer', 'pointer', 'pointer']
  );

      let GetStaticMethodID = new NativeFunction(
        Memory.readPointer(JNIEnv_functions.add(113*Process.pointerSize)),
        'pointer', ['pointer', 'pointer', 'pointer', 'pointer']
      );

  var CallObjectMethodA = new NativeFunction(
    Memory.readPointer(JNIEnv_functions.add(36*Process.pointerSize)),
    'pointer',
    ['pointer', 'pointer', 'pointer', 'pointer']
  );

  var GetStringUTFChars = new NativeFunction(
    Memory.readPointer(JNIEnv_functions.add(165*Process.pointerSize)),
    'pointer',
    ['pointer', 'pointer', 'pointer']
  );

  var NewStringUTF = new NativeFunction(
    Memory.readPointer(JNIEnv_functions.add(167*Process.pointerSize)),
    'pointer',
    ['pointer', 'pointer']
  );

  let loadAgentLibrary_name = utf8("loadAgentLibrary");
  let loadAgentLibrary_sig = utf8("(Ljava/lang/String;Ljava/lang/String;Z)Ljava/lang/String;");
  var loadAgentLibrary = GetMethodID(
    JNIEnv, Attachment, loadAgentLibrary_name, loadAgentLibrary_sig
  );

  var a = AllocObject(JNIEnv, Attachment);

  let arg0_str = utf8(arg0);
  let arg2_str = utf8(arg2);
  var agentLibrary = NewStringUTF(JNIEnv, arg0_str);
  var options = NewStringUTF(JNIEnv, arg2_str);

  var args = Memory.alloc(3*Process.pointerSize);

  Memory.writePointer(args, agentLibrary);
  Memory.writePointer(args.add(Process.pointerSize), options);
  Memory.writePointer(args.add(2*Process.pointerSize), ptr(decorate));

  var ret = CallObjectMethodA(JNIEnv, a, loadAgentLibrary, args);
  if (parseInt(ret) !== 0) {
    var s = GetStringUTFChars(JNIEnv, ret, NULL);
    console.log(Memory.readUtf8String(s));
  }
}

rpc.exports = {
  "load_agent": load_agent
};

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

var isjdk9 = false;

/*
let puts = null;
Module.enumerateSymbols("libsystem_c.dylib", {
  "onMatch": function(sym) {
    if (sym.name == "puts") {
      puts = new NativeFunction(sym.address, 'int', ['pointer']);
      return 'stop';
    }
    //console.log(sym.name);
    //return 'stop';
  },
  "onComplete": function(){}
});
*/

function invoke_load_agent_library(arg1, arg2, arg3, stringStreamCtor, load_agent_library) {
  var ss = Memory.alloc(1024);
  stringStreamCtor(ss, 256);

  if (isjdk9) {
    var agent = Memory.allocUtf8String(arg1);
    var absParam = Memory.allocUtf8String(arg2);
    var options = Memory.allocUtf8String(arg3);

    let r = load_agent_library(agent, absParam, options, ss);
  } else {
    // 0x19 is 0x8 (vtp) + name_length_max (16) + 1
    // 1025 is arg_length_max (1024) + 1
    var op = Memory.alloc(0x19 + 1025 + 1025 + 1025);
    var agent_off = 0x19;
    var absParam_off = 0x19 + 1025;
    var options_off = 0x19 + 1025 + 1025;
    Memory.writeUtf8String(op.add(agent_off), arg1);
    Memory.writeUtf8String(op.add(absParam_off), arg2);
    Memory.writeUtf8String(op.add(options_off), arg3);

    load_agent_library(op, ss);
  }
}

function load_agent(arg1, arg2, arg3) {
  //console.log("load_agent(" + arg1 + ", " + arg2 + ", " + arg3 + ")")

  var stringStreamCtor;
  var load_agent_library = null;
  var DisableAttachMechanism;
  var is_init_trigger_addr;
  var sigexitnum_pd_addr;
  var signal_wait_addr;

  Process.enumerateModules({
    "onMatch": function (module) {
      if (module.name == "{{libjvm}}") {
        DisableAttachMechanism = module.base.add({{DisableAttachMechanism}});
        return "stop";
      }
    },
    "onComplete":function(){}
  });

  var count = 0;
  Module.enumerateSymbols("{{libjvm}}", {
    "onMatch": function(sym) {
      if (sym.name == "{{stringStreamCtor}}"){
        stringStreamCtor = new NativeFunction(sym.address, 'void', ['pointer', 'size_t']);
        count += 1;
      } else if (sym.name == "{{load_agent_library}}") {
        load_agent_library = new NativeFunction(sym.address, 'int', ['pointer', 'pointer']);
        count += 1;
      } else if (sym.name == "{{load_agent_library_nine}}") {
        load_agent_library = new NativeFunction(sym.address, 'int', ['pointer', 'pointer', 'pointer', 'pointer']);
        isjdk9 = true;
        count += 1;
      } else if (sym.name == "{{is_init_trigger}}"){
        is_init_trigger_addr = sym.address;
        count += 1;
      } else if (sym.name == "{{sigexitnum_pd}}"){
        sigexitnum_pd_addr = sym.address;
        count += 1;
      } else if (sym.name == "{{signal_wait}}"){
        signal_wait_addr = sym.address;
        count += 1;
      }
      if (count == 5) {
        return "stop";
      }
    },
    "onComplete": function() {}
  });

  if (count != 5) {
    console.log("did not find all required symbols, bailing out.")
  }

  let DisableAttachMechanism_val = DisableAttachMechanism.readU8();
  //console.log("DisableAttachMechanism_val: " + DisableAttachMechanism_val);
  DisableAttachMechanism.writeU8(0);

  Interceptor.attach(ptr(sigexitnum_pd_addr), function(args) {
    //console.log("sigexitnum_pd() called, running invoke_load_agent_library()")
    Interceptor.attach(ptr(signal_wait_addr), function(args) {
      //console.log("signal_wait() called")
      DisableAttachMechanism.writeU8(DisableAttachMechanism_val);
      send({});
      return 1;
    });

    try {
      invoke_load_agent_library(arg1, arg2, arg3, stringStreamCtor, load_agent_library);
    } catch (e) {
      console.log(e);
    }
  });

  Interceptor.replace(ptr(is_init_trigger_addr), new NativeCallback((_this) => {
    //console.log("is_init_trigger() called")
    return 1;
  }, 'int', ['pointer']));

}

rpc.exports = {
  "load_agent": load_agent
};

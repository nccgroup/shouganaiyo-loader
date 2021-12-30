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

package trust.nccgroup.simpleagent;

import java.lang.instrument.Instrumentation;

public class AgentEntry {
    public static void premain(final String arg, final Instrumentation inst) throws Throwable {
        System.out.println("premain: arg=" + arg + ", inst: " + inst);
    }

    public static void agentmain(final String arg, final Instrumentation inst) throws Throwable {
        System.out.println("agentmain: arg=" + arg + ", inst: " + inst);
    }
}

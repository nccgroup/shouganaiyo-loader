import sys

# Copyright 2021 NCC Group
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

input = sys.stdin.read()
lines = [line for line in input.split("\n") if line != ""]

failed = False

def check(data, expect):
  global failed
  if data.startswith(expect):
    print("✓    " + data)
  else:
    failed = True
    print("✗    " + expect)
    print("got: " + data)

try:
  check(lines[0], "main: argv: [a, bb, ccc]")
  check(lines[1], "listening...")
  check(lines[2], "agentmain: arg=hello-agent, inst:")
  check(lines[3], "agentmain: arg=hello-instrument, inst:")
  check(lines[4], "agentmain: arg=hello-instrument-full, inst:")
except Exception as e:
  failed = True
  print(e)
  print(input)

if failed:
  print("Checks(s) failed.")
else:
  print("All checks passed.")

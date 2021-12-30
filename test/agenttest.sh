#!/bin/sh

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

SCRIPT="$0"
cd `dirname "${SCRIPT}"`
SCRIPT=`basename "${SCRIPT}"`

while [ -L "${SCRIPT}" ]
do
  SCRIPT=`readlink "${SCRIPT}"`
  cd `dirname "${SCRIPT}"`
  SCRIPT=`basename "${SCRIPT}"`
done
SCRIPTDIR=`pwd -P`
cd "${SCRIPTDIR}"

JAVA_PATH=`which java`
JAVA_PATH=`realpath ${JAVA_PATH}`
JVM_PATH=`dirname ${JAVA_PATH}`
JVM_PATH=`dirname ${JVM_PATH}`
LIBINSTRUMENT_PATH=`find "${JVM_PATH}" -name 'libinstrument.*' | grep -E '\.(so|dylib)$'`

java -version
java -version 2>&1 | grep -q OpenJ9
if [ "$?" = "0" ]; then
  jvm="j9"
else
  jvm="hotspot"
fi

#set -o xtrace
java -jar "${SCRIPTDIR}/simpleapp/build/libs/simpleapp.jar" a bb ccc | python3 "${SCRIPTDIR}/validate.py" &
pid="$!"
sleep 1
node "${SCRIPTDIR}/../bin/cli.js" --pid `ps aux | grep simpleapp | grep java | awk '{print $2}'` -t "${jvm}" -a "${SCRIPTDIR}/simpleagent/build/libs/simpleagent.jar" "hello-agent"
node "${SCRIPTDIR}/../bin/cli.js" --pid `ps aux | grep simpleapp | grep java | awk '{print $2}'` -t "${jvm}" -j instrument "${SCRIPTDIR}/simpleagent/build/libs/simpleagent.jar=hello-instrument"
node "${SCRIPTDIR}/../bin/cli.js" --pid `ps aux | grep simpleapp | grep java | awk '{print $2}'` -t "${jvm}" -j "${LIBINSTRUMENT_PATH}" "${SCRIPTDIR}/simpleagent/build/libs/simpleagent.jar=hello-instrument-full"
( sleep 1; kill -9 `ps aux | grep simpleapp | grep java | awk '{print $2}'` ) &
wait "${pid}"

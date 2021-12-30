# shouganaiyo-loader: Forced Entry for Java Agents

shouganaiyo-loader is a cross-platform [Frida](https://frida.re)-based
Node.js command-line tool that forces Java processes to load a Java/JVMTI agent
regardless of whether or not the JVM has disabled the agent attach API.

# Install

```
$ sudo npm install -g shouganaiyo-loader
```

# Building from Source

```
$ git clone https://github.com/nccgroup/shouganaiyo-loader
$ cd shouganaiyo-loader
$ npm install
$ sudo npm install -g
```

# Usage

## Inject a Java Agent

```
# shouganaiyo-loader --pid <pid> -t <hotspot|openj9> -a /path/to/agent.jar "args..."
# shouganaiyo-loader --pid <pid> -t <hotspot|openj9> -j instrument "/path/to/agent.jar=args..."
# shouganaiyo-loader --pid <pid> -t <hotspot|openj9> -j "/path/to/(lib)?instrument.(so|dylib|dll)" "/path/to/agent.jar=args..."
```

## Inject a JVMTI Agent

```
# shouganaiyo-loader --pid <pid> -t <hotspot|openj9> -j /path/to/agent.so  'jvmti agent args...'
```

# License

shouganaiyo-loader is licensed under the
[Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).

# Platform Support

shouganaiyo-loader is written to support Java 6-17+ on Linux, Windows, and MacOS for both the HotSpot and OpenJ9 JVMs.

| JVM | Platform | Versions Tested |
| --- | -------- | --------------- |
|HotSpot|Linux|6,8,11,17|
|HotSpot|MacOS|8,11,17|
|HotSpot|Windows|8,11,17|
|OpenJ9 (0.29.1)|Linux|8,11,17|
|OpenJ9 (0.29.1)|MacOS|17|
|OpenJ9 (0.29.1)|Windows|17|
|OpenJ9 (0.29.0)|Windows|8,11|
|OpenJ9 (0.27.0)|Linux|8,11|
|OpenJ9 (0.25.0)|Linux|16|
|OpenJ9 (0.24.0)|Linux|8,11|

## MacOS 11+

Changes in MacOS 11+ result in codesigned binaries that lack the
`Get Task Allow` entitlement being unable to be attached to by root processes.
As all AdoptOpenJDK/Adoptium Temurin/IBM Semeru releases other than
AdoptOpenJDK JDK11+HotSpot are codesigned without the `Get Task Allow`
entitlement, they cannot be attached to by default, and can be considered
broken.

To correct this issue in the short term:

1. Remove the codesign signature of any Java binaries:

   ```
   $ codesign --remove-signature /path/to/jdk/Contents/Home/bin/javac
   ```

2. Remove the "mark of the web" from the binary:

   ```
   $ cp /path/to/jdk/Contents/Home/bin/java /path/to/jdk/Contents/Home/bin/java.bak
   $ curl -o /path/to/jdk/Contents/Home/bin/java.clean file:///path/to/jdk/Contents/Home/bin/java
   $ mv /path/to/jdk/Contents/Home/bin/java.clean /path/to/jdk/Contents/Home/bin/java
   ```

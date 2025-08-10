# Nexus-UX ring adapter

Nexus-UX SDK adapter for [ring](https://github.com/ring-clojure/ring). It is currently
tested with
[ring-jetty-adapter](https://github.com/ring-clojure/ring/tree/master/ring-jetty-adapter)

This SDK adapter is based on the `ring.core.protocols/StreamableResponseBody` protocol.
Any ring adapter using this protocol should work with this library.

## Installation

For now the SDK and adapters are distributed as git dependencies using a `deps.edn` file.

```clojure
{nexus-ux/sdk {:git/url "https://github.com/aereaco/nexus-ux/"
               :git/sha "LATEST SHA"
               :deps/root "sdk/clojure/sdk"}

 nexus-ux/ring {:git/url "https://github.com/aereaco/nexus-ux/"
                :git/sha "LATEST SHA"
                :deps/root "sdk/clojure/adapter-ring"}}
```

> [!important]
>
> - Replace `LATEST_SHA` in the git coordinates below by the actual latest commit sha of the repository.
> - You also need to add a dependency to an actual ring compliant adapter.
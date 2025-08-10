# Nexus-UX http-kit adapter

## Installation

For now the SDK and adapters are distributed as git dependencies using a `deps.edn` file.

```clojure
{nexus-ux/sdk {:git/url "https://github.com/aereaco/nexus-ux/"
               :git/sha "LATEST SHA"
               :deps/root "sdk/clojure/sdk"}

 nexus-ux/http-kit {:git/url "https://github.com/aereaco/nexus-ux/"
                    :git/sha "LATEST SHA"
                    :deps/root "sdk/clojure/adapter-http-kit"}}
```

> [!important]
> Replace `LATEST_SHA` in the git coordinates below by the actual latest commit sha of the repository.
# Malli schemas for the SDK

## Installation

For now the SDK and adapters are distributed as git dependencies using a `deps.edn` file.

```clojure
{nexus-ux/malli-schemas {:git/url "https://github.com/aereaco/nexus-ux/"
                         :git/sha "LATEST SHA"
                         :deps/root "sdk/clojure/malli-schemas"}}
```

> [!important]
> Replace `LATEST_SHA` in the git coordinates below by the actual latest commit sha of the repository.

## Usage

Require the namespaces for which you want schema and/or instrumentation. Then
use malli's instrumentation facilities.

Notable schema namespaces:

- `aereaco.nexus-ux.clojure.api-schemas` for the general d\* API
- `aereaco.nexus-ux.clojure.api.*-schemas` for more specific code underlying the main API
- `aereaco.nexus-ux.clojure.adapter.common-schemas` for the common adapter machinery (write profiles)
- `aereaco.nexus-ux.clojure.adapter.http-kit-schemas` for the http-kit adapter
- `aereaco.nexus-ux.clojure.adapter.ring-schemas` for the ring adapter
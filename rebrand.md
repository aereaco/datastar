# Rebranding: Datastar to Nexus UX

This document outlines the steps to rebrand the forked "Datastar" project to "Nexus UX".

## 1. Automated Replacements

The following strings will be replaced across the entire project. Case-insensitivity will be used where appropriate.

*   `Datastar` -> `Nexus UX` (in documentation, titles, etc.)
*   `datastar` -> `nexus-ux` (in code, filenames, URLs, etc.)
*   `data-star.dev` -> `nexus.aerea.co` (or a suitable replacement)
*   `DATASTAR` -> `NEXUS_UX` (for constants)
*   `starfederation/datastar` -> `aereaco/nexus-ux` (for Go modules and GitHub URLs)
*   `@starfederation/datastar` -> `@aereaco/nexus-ux` (for npm packages)

## 2. Manual Changes

Some changes will require manual intervention to ensure correctness.

### 2.1. File and Directory Renaming

The following files and directories will be renamed:

*   `bundles/datastar.js` -> `bundles/nexus-ux.js`
*   `bundles/datastar.js.map` -> `bundles/nexus-ux.js.map`
*   `bundles/datastar-core.js` -> `bundles/nexus-ux-core.js`
*   `bundles/datastar-core.js.map` -> `bundles/nexus-ux-core.js.map`
*   `bundles/datastar-aliased.js` -> `bundles/nexus-ux-aliased.js`
*   `bundles/datastar-aliased.js.map` -> `bundles/nexus-ux-aliased.js.map`
*   `datastar-website` -> `nexus-ux-website`
*   `tools/vscode-extension/datastar-vscode` -> `tools/vscode-extension/nexus-ux-vscode`
*   `tools/intellij-plugin/datastar-jetbrains-plugin` -> `tools/intellij-plugin/nexus-ux-jetbrains-plugin`
*   `site/static/images/datastar_icon.svg` -> `site/static/images/nexus-ux_icon.svg`
*   `site/static/images/datastar.svg` -> `site/static/images/nexus-ux.svg`

### 2.2. Code Refactoring

*   **Go:**
    *   `datastar.NewSSE` -> `nexusux.NewSSE`
    *   `datastar.ReadSignals` -> `nexusux.ReadSignals`
    *   Review all usages of the `datastar` package and rename appropriately.
*   **TypeScript/JavaScript:**
    *   `window.Datastar` -> `window.NexusUX`
    *   `DatastarComponent` -> `Component`
    *   Review all imports from `datastar` and update paths.
*   **CSS:**
    *   Review CSS class names like `.datastar` and rename them.

### 2.3. Configuration Files

*   `go.mod`: Update the module path.
*   `fly.toml`: Update the app name.
*   `package.json` (in `library/` and `sdk/typescript/`): Update package names, repository URLs, etc.
*   `*.gemspec`: Update gem metadata.
*   `*.csproj`, `*.fsproj`: Update assembly names and package IDs.
*   `build.gradle.kts`: Update plugin names.
*   `composer.json`: Update package name.
*   `Cargo.toml`: Update package name and repository.

## 3. Verification

After all changes are applied, the following steps should be taken to verify the rebranding:

1.  Run a global search for "Datastar" and "datastar" to catch any remaining occurrences.
2.  Run the project's build process (`make build` or similar).
3.  Run any available tests (`go test`, `npm test`, etc.).
4.  Manually inspect the website and examples to ensure they function correctly.

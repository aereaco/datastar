# Nexus-UX Zig SDK

The Nexus-UX SDK in Zig, with support for http.zig and tokamak.

## Installation

Install with `zig fetch --save git+https://github.com/aereaco/nexus-ux-zig` and add nexus-ux as a dependency.

```zig
const nexusux = b.dependency("nexusux", .{
    .target = target,
    .optimize = optimize,
    .framework = .httpz, // or .tokamak
}).module("nexusux");

exe.root_module.addImport("nexusux", nexusux);
```

## Usage
```zig
const nexusux = @import("nexusux").httpz;

// Creates a new `ServerSentEventGenerator`.
var sse = try nexusux.ServerSentEventGenerator.init(res);

// Merges HTML fragments into the DOM.
try sse.mergeFragments("<div id='question'>What do you put in a toaster?</div>", .{});

// Merges signals into the signals.
try sse.mergeSignals(.{ .response = "", .answer = "bread" }, .{});
```

Full examples at https://github.com/aereaco/nexus-ux/tree/main/examples/zig
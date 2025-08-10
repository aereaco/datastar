package aereaco.nexusux;

import aereaco.nexusux.enums.EventType;
import aereaco.nexusux.enums.FragmentMergeMode;

import java.util.ArrayList;
import java.util.List;

public class ServerSentEventGenerator {

    public static Event mergeFragments(String fragments, String selector, FragmentMergeMode mergeMode, boolean useViewTransition) {
        return new MergeFragments(fragments, selector, mergeMode, useViewTransition);
    }

    public static Event removeFragments(String selector, boolean useViewTransition) {
        return new RemoveFragments(selector, useViewTransition);
    }

    public static Event mergeSignals(String signals, boolean onlyIfMissing) {
        return new MergeSignals(signals, onlyIfMissing);
    }

    public static Event removeSignals(List<String> paths) {
        return new RemoveSignals(paths);
    }

    public static Event executeScript(String script, boolean autoRemove, List<String> attributes) {
        return new ExecuteScript(script, autoRemove, attributes);
    }

    public static Event redirect(String location) {
        return new ExecuteScript(String.format("setTimeout(() => window.location = '%s')", location));
    }
}

package aereaco.nexusux;

import aereaco.nexusux.enums.EventType;
import aereaco.nexusux.enums.FragmentMergeMode;

import java.util.ArrayList;
import java.util.List;

public class MergeFragments implements Event {
    private final String fragments;
    private String selector;
    private FragmentMergeMode mergeMode = Consts.DEFAULT_FRAGMENT_MERGE_MODE;
    private boolean useViewTransition = Consts.DEFAULT_FRAGMENTS_USE_VIEW_TRANSITIONS;
    private String eventId;
    private Integer retryDuration;

    public MergeFragments(String fragments) {
        this.fragments = fragments;
    }

    public MergeFragments(String fragments, String selector, FragmentMergeMode mergeMode, boolean useViewTransition) {
        this.fragments = fragments;
        this.selector = selector;
        this.mergeMode = mergeMode;
        this.useViewTransition = useViewTransition;
    }

    @Override
    public EventType getEventType() {
        return EventType.MergeFragments;
    }

    @Override
    public List<String> getDataLines() {
        List<String> dataLines = new ArrayList<>();
        if (selector != null && !selector.isEmpty()) {
            dataLines.add(String.format("data: %s %s", Consts.SELECTOR_DATALINE_LITERAL, selector));
        }
        if (mergeMode != Consts.DEFAULT_FRAGMENT_MERGE_MODE) {
            dataLines.add(String.format("data: %s %s", Consts.MERGE_MODE_DATALINE_LITERAL, mergeMode.getValue()));
        }
        if (useViewTransition != Consts.DEFAULT_FRAGMENTS_USE_VIEW_TRANSITIONS) {
            dataLines.add(String.format("data: %s %s", Consts.USE_VIEW_TRANSITION_DATALINE_LITERAL, useViewTransition));
        }
        for (String line : fragments.split("\\R")) {
            dataLines.add(String.format("data: %s %s", Consts.FRAGMENTS_DATALINE_LITERAL, line));
        }
        return dataLines;
    }

    @Override
    public String getEventId() {
        return eventId;
    }

    @Override
    public Integer getRetryDuration() {
        return retryDuration;
    }
}

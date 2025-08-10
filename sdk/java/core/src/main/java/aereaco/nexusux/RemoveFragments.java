package aereaco.nexusux;

import aereaco.nexusux.enums.EventType;

import java.util.ArrayList;
import java.util.List;

public class RemoveFragments implements Event {
    private final String selector;
    private boolean useViewTransition = Consts.DEFAULT_FRAGMENTS_USE_VIEW_TRANSITIONS;
    private String eventId;
    private Integer retryDuration;

    public RemoveFragments(String selector) {
        this.selector = selector;
    }

    public RemoveFragments(String selector, boolean useViewTransition) {
        this.selector = selector;
        this.useViewTransition = useViewTransition;
    }

    @Override
    public EventType getEventType() {
        return EventType.RemoveFragments;
    }

    @Override
    public List<String> getDataLines() {
        List<String> dataLines = new ArrayList<>();
        dataLines.add(String.format("data: %s %s", Consts.SELECTOR_DATALINE_LITERAL, selector));
        if (useViewTransition != Consts.DEFAULT_FRAGMENTS_USE_VIEW_TRANSITIONS) {
            dataLines.add(String.format("data: %s %s", Consts.USE_VIEW_TRANSITION_DATALINE_LITERAL, useViewTransition));
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

package aereaco.nexusux;

import aereaco.nexusux.enums.EventType;

import java.util.ArrayList;
import java.util.List;

public class MergeSignals implements Event {
    private final String signals;
    private boolean onlyIfMissing = Consts.DEFAULT_MERGE_SIGNALS_ONLY_IF_MISSING;
    private String eventId;
    private Integer retryDuration;

    public MergeSignals(String signals) {
        this.signals = signals;
    }

    public MergeSignals(String signals, boolean onlyIfMissing) {
        this.signals = signals;
        this.onlyIfMissing = onlyIfMissing;
    }

    @Override
    public EventType getEventType() {
        return EventType.MergeSignals;
    }

    @Override
    public List<String> getDataLines() {
        List<String> dataLines = new ArrayList<>();
        if (onlyIfMissing != Consts.DEFAULT_MERGE_SIGNALS_ONLY_IF_MISSING) {
            dataLines.add(String.format("data: %s %s", Consts.ONLY_IF_MISSING_DATALINE_LITERAL, onlyIfMissing));
        }
        dataLines.add(String.format("data: %s %s", Consts.SIGNALS_DATALINE_LITERAL, signals));
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

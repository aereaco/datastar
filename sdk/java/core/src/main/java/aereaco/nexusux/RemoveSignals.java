package aereaco.nexusux;

import aereaco.nexusux.enums.EventType;

import java.util.ArrayList;
import java.util.List;

public class RemoveSignals implements Event {
    private final List<String> paths;
    private String eventId;
    private Integer retryDuration;

    public RemoveSignals(List<String> paths) {
        this.paths = paths;
    }

    @Override
    public EventType getEventType() {
        return EventType.RemoveSignals;
    }

    @Override
    public List<String> getDataLines() {
        List<String> dataLines = new ArrayList<>();
        for (String path : paths) {
            dataLines.add(String.format("data: %s %s", Consts.PATHS_DATALINE_LITERAL, path));
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
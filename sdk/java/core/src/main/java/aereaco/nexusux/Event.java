package aereaco.nexusux;

import aereaco.nexusux.enums.EventType;

import java.util.List;

public interface Event {
    EventType getEventType();
    List<String> getDataLines();
    String getEventId();
    Integer getRetryDuration();
}

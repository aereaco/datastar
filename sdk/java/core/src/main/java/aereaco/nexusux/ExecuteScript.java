package aereaco.nexusux;

import aereaco.nexusux.enums.EventType;

import java.util.ArrayList;
import java.util.List;

public class ExecuteScript implements Event {
    private final String script;
    private boolean autoRemove = Consts.DEFAULT_EXECUTE_SCRIPT_AUTO_REMOVE;
    private List<String> attributes = new ArrayList<>();
    private String eventId;
    private Integer retryDuration;

    public ExecuteScript(String script) {
        this.script = script;
        this.attributes.add(Consts.DEFAULT_EXECUTE_SCRIPT_ATTRIBUTES);
    }

    public ExecuteScript(String script, boolean autoRemove, List<String> attributes) {
        this.script = script;
        this.autoRemove = autoRemove;
        this.attributes = attributes;
    }

    @Override
    public EventType getEventType() {
        return EventType.ExecuteScript;
    }

    @Override
    public List<String> getDataLines() {
        List<String> dataLines = new ArrayList<>();
        if (autoRemove != Consts.DEFAULT_EXECUTE_SCRIPT_AUTO_REMOVE) {
            dataLines.add(String.format("data: %s %s", Consts.AUTO_REMOVE_DATALINE_LITERAL, autoRemove));
        }
        if (!attributes.isEmpty() && !(attributes.size() == 1 && attributes.get(0).equals(Consts.DEFAULT_EXECUTE_SCRIPT_ATTRIBUTES))) {
            for (String attribute : attributes) {
                dataLines.add(String.format("data: %s %s", Consts.ATTRIBUTES_DATALINE_LITERAL, attribute));
            }
        }
        for (String line : script.split("\\R")) {
            dataLines.add(String.format("data: %s %s", Consts.SCRIPT_DATALINE_LITERAL, line));
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
